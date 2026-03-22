"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import type { FilterSpecification } from "maplibre-gl";
import "@maplibre/maplibre-gl-leaflet";

const OPENMAPTILES_SOURCE_ID = "openmaptiles";
const DEFAULT_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://openfreemap.org">OpenFreeMap</a>';

const DISPUTED_NAME_ALIASES = new Set(
  [
    "Hoang Sa",
    "Hoang Sa Islands",
    "Paracel",
    "Paracel Islands",
    "Paracels",
    "Tay Sa",
    "Truong Sa",
    "Truong Sa Islands",
    "Spratly",
    "Spratly Islands",
    "Spratlys",
    "Nansha",
    "Nansha Islands",
    "Nam Sa",
    "\u897f\u6c99\u7fa4\u5c9b",
    "\u5357\u6c99\u7fa4\u5c9b",
  ].map(normalizeLabel)
);

type FeatureId = string | number;

interface MapLibreBasemapProps {
  styleUrl?: string;
}

function normalizeLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u0111\u0110]/g, "d")
    .toLowerCase()
    .trim();
}

function getLabelCandidates(properties: Record<string, unknown> | undefined) {
  if (!properties) return [];

  const keys = ["name_en", "name:en", "name_vi", "name:vi", "name_zh", "name:zh", "name", "name_local", "name_int"];
  const labels: string[] = [];

  for (const key of keys) {
    const value = properties[key];
    if (typeof value === "string" && value.trim()) {
      labels.push(normalizeLabel(value));
    }
  }

  return labels;
}

function isTargetDisputedLabel(properties: Record<string, unknown> | undefined) {
  return getLabelCandidates(properties).some((label) => DISPUTED_NAME_ALIASES.has(label));
}

function isDisputedMaritimeFeature(properties: Record<string, unknown> | undefined) {
  if (!properties) return false;

  const disputed = Number(properties.disputed ?? 0);
  const maritime = Number(properties.maritime ?? 0);

  return disputed === 1 && maritime === 1;
}

function buildIdExclusionFilter(ids: FeatureId[]) {
  if (ids.length === 0) return undefined;

  return ["all", ...ids.map((id) => ["!=", ["id"], id])] as unknown as FilterSpecification;
}

function combineFilters(
  existingFilter: FilterSpecification | null | undefined,
  nextFilter: FilterSpecification
): FilterSpecification {
  return (existingFilter ? ["all", existingFilter, nextFilter] : nextFilter) as FilterSpecification;
}

function getSourceLayer(layer: unknown) {
  return (layer as { ["source-layer"]?: string })["source-layer"];
}

export default function MapLibreBasemap({ styleUrl = DEFAULT_STYLE_URL }: MapLibreBasemapProps) {
  const map = useMap();
  const sourceLayerIdsRef = useRef({
    place: new Set<FeatureId>(),
    waterName: new Set<FeatureId>(),
    boundary: new Set<FeatureId>(),
  });
  const baseFiltersRef = useRef(new Map<string, FilterSpecification | null>());

  useEffect(() => {
    const basemapLayer = L.maplibreGL({
      style: styleUrl,
      interactive: false,
      minZoom: 1,
    });

    basemapLayer.addTo(map);
    const glMap = basemapLayer.getMaplibreMap();
    map.attributionControl?.addAttribution(ATTRIBUTION);

    const collectVisibleFeatureIds = () => {
      if (!glMap.isStyleLoaded()) return;

      const nextSourceLayerIds = {
        place: new Set<FeatureId>(),
        waterName: new Set<FeatureId>(),
        boundary: new Set<FeatureId>(),
      };

      const collect = (sourceLayer: "place" | "water_name" | "boundary", targetSet: Set<FeatureId>) => {
        const features = glMap.querySourceFeatures(OPENMAPTILES_SOURCE_ID, { sourceLayer });

        for (const feature of features) {
          if (feature.id == null) continue;

          const properties = feature.properties as Record<string, unknown> | undefined;
          const shouldHide =
            sourceLayer === "boundary"
              ? isDisputedMaritimeFeature(properties)
              : isTargetDisputedLabel(properties) || isDisputedMaritimeFeature(properties);

          if (shouldHide) {
            targetSet.add(feature.id);
          }
        }
      };

      collect("place", nextSourceLayerIds.place);
      collect("water_name", nextSourceLayerIds.waterName);
      collect("boundary", nextSourceLayerIds.boundary);

      sourceLayerIdsRef.current = nextSourceLayerIds;
    };

    const applyStyleFilters = () => {
      if (!glMap.isStyleLoaded()) return;

      const style = glMap.getStyle();
      const currentIds = sourceLayerIdsRef.current;

      for (const layer of style.layers ?? []) {
        const sourceLayer = getSourceLayer(layer);
        if (!sourceLayer) continue;

        if (layer.type === "symbol" && (sourceLayer === "place" || sourceLayer === "water_name")) {
          const hiddenIds = sourceLayer === "place" ? currentIds.place : currentIds.waterName;
          const exclusionFilter = buildIdExclusionFilter([...hiddenIds]);
          if (!exclusionFilter) continue;

          const baseFilter = baseFiltersRef.current.get(layer.id);
          glMap.setFilter(layer.id, combineFilters(baseFilter, exclusionFilter));
          continue;
        }

        if (layer.type === "line" && sourceLayer === "boundary") {
          const boundaryFilter: FilterSpecification = [
            "all",
            ["!=", ["coalesce", ["get", "disputed"], 0], 1],
            ["!=", ["coalesce", ["get", "maritime"], 0], 1],
          ];

          const baseFilter = baseFiltersRef.current.get(layer.id);
          glMap.setFilter(layer.id, combineFilters(baseFilter, boundaryFilter));
        }
      }
    };

    const syncBasemapTweaks = () => {
      collectVisibleFeatureIds();
      applyStyleFilters();
    };

    const onStyleLoad = () => {
      baseFiltersRef.current.clear();

      const style = glMap.getStyle();
      for (const layer of style.layers ?? []) {
        const sourceLayer = getSourceLayer(layer);
        if (!sourceLayer) continue;

        if (layer.type === "symbol" && (sourceLayer === "place" || sourceLayer === "water_name")) {
          baseFiltersRef.current.set(layer.id, glMap.getFilter(layer.id) ?? null);
        }

        if (layer.type === "line" && sourceLayer === "boundary") {
          baseFiltersRef.current.set(layer.id, glMap.getFilter(layer.id) ?? null);
        }
      }

      syncBasemapTweaks();
    };

    glMap.on("style.load", onStyleLoad);
    glMap.on("sourcedata", syncBasemapTweaks);
    glMap.on("moveend", syncBasemapTweaks);
    glMap.on("idle", syncBasemapTweaks);

    if (glMap.isStyleLoaded()) {
      onStyleLoad();
    }

    return () => {
      glMap.off("style.load", onStyleLoad);
      glMap.off("sourcedata", syncBasemapTweaks);
      glMap.off("moveend", syncBasemapTweaks);
      glMap.off("idle", syncBasemapTweaks);
      map.attributionControl?.removeAttribution(ATTRIBUTION);
      map.removeLayer(basemapLayer);
    };
  }, [map, styleUrl]);

  return null;
}
