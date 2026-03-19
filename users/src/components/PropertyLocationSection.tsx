"use client";

import dynamic from "next/dynamic";
import L, { type LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { useLanguage } from "@/context/LanguageContext";
import {
  DEFAULT_PROPERTY_COORDINATES,
  usePropertyLocationPicker,
  type PropertyLocationFormValue,
} from "@/hooks/usePropertyLocationPicker";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });

const markerSvg = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
    '<circle cx="12" cy="12" r="9" fill="#3b82f6" stroke="white" stroke-width="3"/>' +
  "</svg>"
);

const customIcon = L.icon({
  iconUrl: `data:image/svg+xml,${markerSvg}`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

type PropertyLocationSectionProps = {
  isOpen: boolean;
  value: PropertyLocationFormValue;
  onChange: (patch: Partial<PropertyLocationFormValue>) => void;
};

function MapViewportController({
  center,
  zoom,
  isOpen,
}: {
  center: [number, number];
  zoom: number;
  isOpen: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!isOpen) return;

    const resize = () => map.invalidateSize();
    resize();
    const timer = window.setTimeout(resize, 180);

    return () => window.clearTimeout(timer);
  }, [isOpen, map]);

  useEffect(() => {
    map.flyTo(center, zoom, {
      animate: true,
      duration: 0.45,
    });
  }, [center, map, zoom]);

  return null;
}

function MapInteractionHandler({
  onPick,
}: {
  onPick: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click(event: LeafletMouseEvent) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

export default function PropertyLocationSection({ isOpen, value, onChange }: PropertyLocationSectionProps) {
  const { t } = useLanguage();
  const {
    provinces,
    availableWards,
    isLocationsLoading,
    isGeocoding,
    mapState,
    resolvedPinLabel,
    selectedProvinceCode,
    selectedWardCode,
    handleProvinceChange,
    handleWardChange,
    handleStreetAddressChange,
    handleManualCoordinatesChange,
    handleUseCurrentLocation,
  } = usePropertyLocationPicker({
    isOpen,
    value,
    onChange,
  });

  const markerPosition = useMemo<[number, number]>(() => {
    const hasExplicitCoordinates = Number.isFinite(value.latitude) && Number.isFinite(value.longitude);
    if (hasExplicitCoordinates) {
      return [value.latitude, value.longitude];
    }

    return DEFAULT_PROPERTY_COORDINATES;
  }, [value.latitude, value.longitude]);

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            {t("property.filters.provinceCity")} <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={selectedProvinceCode || ""}
            onChange={(event) => void handleProvinceChange(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLocationsLoading}
          >
            <option value="">{t("property.filters.provinceCity")}</option>
            {provinces.map((province) => (
              <option key={province.code} value={province.code}>
                {province.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            {t("property.form.wardLabel")} <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={selectedWardCode || ""}
            onChange={(event) => void handleWardChange(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!selectedProvinceCode || isLocationsLoading}
          >
            <option value="">{t("property.form.wardLabel")}</option>
            {availableWards.map((ward) => (
              <option key={ward.code} value={ward.code}>
                {ward.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          {t("property.form.streetAddressLabel")} <span className="text-red-500">*</span>
        </label>
        <input
          required
          name="street_address"
          value={value.streetAddress}
          onChange={(event) => handleStreetAddressChange(event.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={t("property.form.streetAddressLabel")}
        />
      </div>

      <div className="space-y-1">
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            {t("property.form.exactLocationLabel")} <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => void handleUseCurrentLocation()}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 transition-colors hover:text-blue-700"
          >
            <Navigation size={12} />
            {t("property.form.useCurrentLocation")}
          </button>
        </div>

        <div className="relative">
          <div className="z-10 h-[200px] w-full overflow-hidden rounded-xl border border-gray-200">
            {typeof window !== "undefined" ? (
              <MapContainer center={DEFAULT_PROPERTY_COORDINATES} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <Marker
                  draggable
                  position={markerPosition}
                  icon={customIcon}
                  eventHandlers={{
                    dragend: (event) => {
                      const marker = event.target as L.Marker;
                      const position = marker.getLatLng();
                      void handleManualCoordinatesChange(position.lat, position.lng, { refreshLabel: true });
                    },
                  }}
                />
                <MapViewportController center={mapState.center} zoom={mapState.zoom} isOpen={isOpen} />
                <MapInteractionHandler onPick={(latitude, longitude) => void handleManualCoordinatesChange(latitude, longitude, { refreshLabel: true })} />
              </MapContainer>
            ) : null}
          </div>

          {isGeocoding ? (
            <div className="absolute inset-0 z-[1001] flex items-center justify-center rounded-xl bg-white/40 backdrop-blur-[1px]">
              <div className="flex items-center gap-2 rounded-full border border-blue-50/50 bg-white/90 px-3 py-1.5 shadow-sm">
                <Loader2 size={14} className="animate-spin text-blue-600" />
                <span className="text-[11px] font-medium uppercase tracking-tight text-blue-700">
                  {t("property.form.geocodingLoading")}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <p className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-400">
          <MapPin size={10} className="text-gray-300" />
          {t("property.form.dragPinHint")}
        </p>

        {resolvedPinLabel ? <p className="text-xs text-gray-500">{resolvedPinLabel}</p> : null}
      </div>
    </>
  );
}
