"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getBestAvailableLocation } from "@/utils/location";
import {
  normalizeVietnamStreetAddressInput,
  type LocationPrecision,
  type LocationResolution,
  resolveVietnamDetailedAddress,
  resolveVietnamProvinceCenter,
  resolveVietnamWardCenter,
  reverseGeocodeVietnamCoordinates,
} from "@/utils/geocoding";
import {
  findProvinceByCode,
  findProvinceByName,
  findWardByCode,
  findWardByName,
  loadVietnamAdministrativeData,
  type VietnamProvince,
  type VietnamWard,
} from "@/utils/vietnamAdministrative";

export const DEFAULT_PROPERTY_COORDINATES: [number, number] = [21.0285, 105.8542];

const DEFAULT_MAP_ZOOM = 13;
const DETAIL_GEOCODE_DEBOUNCE_MS = 700;
const MIN_ACCEPTED_STREET_CONFIDENCE = 0.72;

type GeocodingStage = "province" | "ward" | "detail" | "reverse" | null;

export type ViewportSource = "province" | "ward" | "street" | "manual";

export interface PropertyLocationFormValue {
  city: string;
  cityCode: string;
  ward: string;
  wardCode: string;
  streetAddress: string;
  latitude: number;
  longitude: number;
}

type PropertyLocationPatch = Partial<PropertyLocationFormValue>;

export type PropertyLocationViewportState = {
  viewportCenter: [number, number];
  viewportZoom: number;
  viewportSource: ViewportSource | null;
};

type ResolvedPropertyLocationState = {
  markerLat: number;
  markerLng: number;
  locationPrecision: LocationPrecision;
  locationConfidence: number;
  requiresManualConfirmation: boolean;
  displayName: string;
};

type UsePropertyLocationPickerOptions = {
  isOpen: boolean;
  value: PropertyLocationFormValue;
  onChange: (patch: PropertyLocationPatch) => void;
};

export type PropertyLocationStatus = {
  precision: LocationPrecision;
  confidence: number;
  requiresManualPinConfirmation: boolean;
  hasManualPinOverride: boolean;
  resolvedLabel: string;
  normalizedStreetAddress: string;
  viewportSource: ViewportSource | null;
};

function createDefaultResolvedLocationState(): ResolvedPropertyLocationState {
  return {
    markerLat: DEFAULT_PROPERTY_COORDINATES[0],
    markerLng: DEFAULT_PROPERTY_COORDINATES[1],
    locationPrecision: "province",
    locationConfidence: 0,
    requiresManualConfirmation: true,
    displayName: "",
  };
}

function toViewportState(center: [number, number], zoom: number, source: ViewportSource | null): PropertyLocationViewportState {
  return {
    viewportCenter: center,
    viewportZoom: zoom,
    viewportSource: source,
  };
}

function getAreaViewportSource(precision: LocationPrecision): ViewportSource {
  return precision === "ward" ? "ward" : "province";
}

function toResolvedLocationState(resolution: LocationResolution): ResolvedPropertyLocationState {
  return {
    markerLat: resolution.lat,
    markerLng: resolution.lon,
    locationPrecision: resolution.precision,
    locationConfidence: resolution.confidence,
    requiresManualConfirmation: resolution.requiresManualConfirmation,
    displayName: resolution.displayName,
  };
}

export function usePropertyLocationPicker({ isOpen, value, onChange }: UsePropertyLocationPickerOptions) {
  const [provinces, setProvinces] = useState<VietnamProvince[]>([]);
  const [wards, setWards] = useState<VietnamWard[]>([]);
  const [isLocationsLoading, setIsLocationsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [lastStage, setLastStage] = useState<GeocodingStage>(null);
  const [viewportState, setViewportState] = useState<PropertyLocationViewportState>(() =>
    toViewportState(DEFAULT_PROPERTY_COORDINATES, DEFAULT_MAP_ZOOM, null)
  );
  const [resolvedLocationState, setResolvedLocationState] = useState<ResolvedPropertyLocationState>(() =>
    createDefaultResolvedLocationState()
  );
  const [resolvedPinLabel, setResolvedPinLabel] = useState("");
  const [areaResolution, setAreaResolution] = useState<LocationResolution | null>(null);
  const [detailResolution, setDetailResolution] = useState<LocationResolution | null>(null);
  const [hasManualPinOverride, setHasManualPinOverride] = useState(false);
  const requestIdRef = useRef(0);
  const activeControllerRef = useRef<AbortController | null>(null);
  const detailDebounceRef = useRef<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setIsLocationsLoading(true);

    loadVietnamAdministrativeData(controller.signal)
      .then(({ provinces: nextProvinces, wards: nextWards }) => {
        setProvinces(nextProvinces);
        setWards(nextWards);
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLocationsLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!isOpen || provinces.length === 0) return;

    const nextSelectedProvince =
      findProvinceByCode(provinces, value.cityCode) || findProvinceByName(provinces, value.city);
    const nextSelectedWard =
      findWardByCode(wards, value.wardCode) ||
      findWardByName(wards, value.ward, nextSelectedProvince?.code ?? value.cityCode ?? undefined);

    const patch: PropertyLocationPatch = {};
    if (nextSelectedProvince && nextSelectedProvince.code !== value.cityCode) {
      patch.cityCode = nextSelectedProvince.code;
    }
    if (nextSelectedProvince && nextSelectedProvince.name !== value.city) {
      patch.city = nextSelectedProvince.name;
    }
    if (nextSelectedWard && nextSelectedWard.code !== value.wardCode) {
      patch.wardCode = nextSelectedWard.code;
    }
    if (nextSelectedWard && nextSelectedWard.name !== value.ward) {
      patch.ward = nextSelectedWard.name;
    }

    if (Object.keys(patch).length > 0) {
      onChange(patch);
    }
  }, [isOpen, onChange, provinces, value.city, value.cityCode, value.ward, value.wardCode, wards]);

  const selectedProvince =
    findProvinceByCode(provinces, value.cityCode) || findProvinceByName(provinces, value.city);
  const selectedWard =
    findWardByCode(wards, value.wardCode) ||
    findWardByName(wards, value.ward, selectedProvince?.code ?? value.cityCode ?? undefined);

  const cityAliases = useMemo(
    () => [selectedProvince?.name_with_type, selectedProvince?.slug].filter((alias): alias is string => Boolean(alias)),
    [selectedProvince?.name_with_type, selectedProvince?.slug]
  );
  const wardAliases = useMemo(
    () =>
      [selectedWard?.name_with_type, selectedWard?.path, selectedWard?.path_with_type, selectedWard?.slug].filter(
        (alias): alias is string => Boolean(alias)
      ),
    [selectedWard?.name_with_type, selectedWard?.path, selectedWard?.path_with_type, selectedWard?.slug]
  );
  const cityAliasKey = useMemo(() => cityAliases.join("|"), [cityAliases]);
  const wardAliasKey = useMemo(() => wardAliases.join("|"), [wardAliases]);

  const availableWards = useMemo(() => {
    const provinceCode = selectedProvince?.code ?? value.cityCode;
    if (!provinceCode) return [];

    return wards
      .filter((ward) => String(ward.parent_code) === String(provinceCode))
      .sort((first, second) => first.name.localeCompare(second.name, "vi", { sensitivity: "base" }));
  }, [selectedProvince?.code, value.cityCode, wards]);

  const normalizedStreetAddress = useMemo(
    () => normalizeVietnamStreetAddressInput(value.streetAddress, value.ward, value.city),
    [value.city, value.streetAddress, value.ward]
  );

  const invalidatePendingRequests = useCallback(() => {
    if (detailDebounceRef.current !== null) {
      window.clearTimeout(detailDebounceRef.current);
      detailDebounceRef.current = null;
    }

    requestIdRef.current += 1;
    activeControllerRef.current?.abort();
    activeControllerRef.current = null;
    setIsGeocoding(false);
    setLastStage(null);
  }, []);

  useEffect(() => invalidatePendingRequests, [invalidatePendingRequests]);

  const beginRequest = useCallback(
    (stage: GeocodingStage) => {
      invalidatePendingRequests();
      const controller = new AbortController();
      activeControllerRef.current = controller;
      requestIdRef.current += 1;
      setIsGeocoding(true);
      setLastStage(stage);
      return { controller, requestId: requestIdRef.current };
    },
    [invalidatePendingRequests]
  );

  const finishRequest = useCallback((requestId: number) => {
    if (requestId !== requestIdRef.current) return;

    setIsGeocoding(false);
    setLastStage(null);
    activeControllerRef.current = null;
  }, []);

  const commitCoordinatesIfChanged = useCallback(
    (latitude: number, longitude: number) => {
      if (value.latitude === latitude && value.longitude === longitude) return;

      onChange({
        latitude,
        longitude,
      });
    },
    [onChange, value.latitude, value.longitude]
  );

  const applyDefaultState = useCallback(
    (shouldCommitCoordinates: boolean) => {
      setAreaResolution(null);
      setDetailResolution(null);
      setResolvedPinLabel("");
      setViewportState(toViewportState(DEFAULT_PROPERTY_COORDINATES, DEFAULT_MAP_ZOOM, null));
      setResolvedLocationState(createDefaultResolvedLocationState());

      if (shouldCommitCoordinates) {
        commitCoordinatesIfChanged(DEFAULT_PROPERTY_COORDINATES[0], DEFAULT_PROPERTY_COORDINATES[1]);
      }
    },
    [commitCoordinatesIfChanged]
  );

  const applyAreaResolution = useCallback(
    (resolution: LocationResolution, source: ViewportSource) => {
      setAreaResolution(resolution);
      setDetailResolution(null);
      setResolvedPinLabel(resolution.displayName);
      setViewportState(toViewportState([resolution.lat, resolution.lon], resolution.zoom, source));
      setResolvedLocationState(toResolvedLocationState(resolution));
      commitCoordinatesIfChanged(resolution.lat, resolution.lon);
    },
    [commitCoordinatesIfChanged]
  );

  const restoreAreaFallback = useCallback(() => {
    if (areaResolution) {
      applyAreaResolution(areaResolution, getAreaViewportSource(areaResolution.precision));
      return;
    }

    applyDefaultState(true);
  }, [applyAreaResolution, applyDefaultState, areaResolution]);

  const applyStreetResolution = useCallback(
    (resolution: LocationResolution) => {
      setDetailResolution(resolution);
      setResolvedPinLabel(resolution.displayName);
      setViewportState(toViewportState([resolution.lat, resolution.lon], resolution.zoom, "street"));
      setResolvedLocationState(toResolvedLocationState(resolution));
      commitCoordinatesIfChanged(resolution.lat, resolution.lon);
    },
    [commitCoordinatesIfChanged]
  );

  useEffect(() => {
    if (!isOpen || provinces.length === 0) return;

    const nextCity = selectedProvince?.name || value.city.trim();
    const nextWard = selectedWard?.name || value.ward.trim();

    if (!nextCity) {
      setHasManualPinOverride(false);
      applyDefaultState(false);
      return;
    }

    const stage = nextWard ? "ward" : "province";
    const { controller, requestId } = beginRequest(stage);

    const resolveArea = async () => {
      try {
        const resolution = nextWard
          ? await resolveVietnamWardCenter({ ward: nextWard, city: nextCity, wardAliases, cityAliases }, controller.signal)
          : await resolveVietnamProvinceCenter(nextCity, controller.signal, cityAliases);

        if (!resolution || requestId !== requestIdRef.current) return;

        setHasManualPinOverride(false);
        applyAreaResolution(resolution, nextWard ? "ward" : "province");
      } catch {
        if (!controller.signal.aborted) {
          setHasManualPinOverride(false);
          applyDefaultState(true);
        }
      } finally {
        finishRequest(requestId);
      }
    };

    void resolveArea();
  }, [
    applyAreaResolution,
    applyDefaultState,
    beginRequest,
    cityAliasKey,
    cityAliases,
    finishRequest,
    isOpen,
    provinces.length,
    selectedProvince?.code,
    selectedProvince?.name,
    selectedWard?.code,
    selectedWard?.name,
    value.city,
    value.ward,
    wardAliasKey,
    wardAliases,
  ]);

  useEffect(() => {
    if (!isOpen) return;

    if (!normalizedStreetAddress) {
      setDetailResolution(null);
      if (!hasManualPinOverride) {
        restoreAreaFallback();
      }
      return;
    }

    if (hasManualPinOverride) return;
    if (!selectedProvince?.name && !value.city.trim()) return;
    if (!areaResolution) return;

    if (detailDebounceRef.current !== null) {
      window.clearTimeout(detailDebounceRef.current);
    }

    detailDebounceRef.current = window.setTimeout(() => {
      const { controller, requestId } = beginRequest("detail");

      const resolveDetail = async () => {
        try {
          const resolution = await resolveVietnamDetailedAddress(
            {
              streetAddress: value.streetAddress,
              ward: selectedWard?.name || value.ward,
              city: selectedProvince?.name || value.city,
              wardAliases,
              cityAliases,
            },
            controller.signal
          );

          if (requestId !== requestIdRef.current) return;

          if (
            !resolution ||
            (resolution.precision !== "exact" &&
              !(resolution.precision === "street" && resolution.confidence >= MIN_ACCEPTED_STREET_CONFIDENCE))
          ) {
            setDetailResolution(null);
            restoreAreaFallback();
            return;
          }

          applyStreetResolution(resolution);
        } catch {
          if (!controller.signal.aborted) {
            setDetailResolution(null);
            restoreAreaFallback();
          }
        } finally {
          finishRequest(requestId);
        }
      };

      void resolveDetail();
    }, DETAIL_GEOCODE_DEBOUNCE_MS);
  }, [
    areaResolution,
    applyStreetResolution,
    beginRequest,
    cityAliases,
    finishRequest,
    hasManualPinOverride,
    isOpen,
    normalizedStreetAddress,
    restoreAreaFallback,
    selectedProvince?.name,
    selectedWard?.name,
    value.city,
    value.streetAddress,
    value.ward,
    wardAliases,
  ]);

  const handleProvinceChange = useCallback(
    (provinceCode: string) => {
      const province = findProvinceByCode(provinces, provinceCode);

      invalidatePendingRequests();
      setHasManualPinOverride(false);
      setDetailResolution(null);
      setAreaResolution(null);
      setResolvedPinLabel("");
      setViewportState(toViewportState(DEFAULT_PROPERTY_COORDINATES, DEFAULT_MAP_ZOOM, null));
      setResolvedLocationState(createDefaultResolvedLocationState());

      onChange({
        city: province?.name || "",
        cityCode: province?.code || "",
        ward: "",
        wardCode: "",
        latitude: DEFAULT_PROPERTY_COORDINATES[0],
        longitude: DEFAULT_PROPERTY_COORDINATES[1],
      });
    },
    [invalidatePendingRequests, onChange, provinces]
  );

  const handleWardChange = useCallback(
    (wardCode: string) => {
      const ward = findWardByCode(availableWards, wardCode);

      invalidatePendingRequests();
      setHasManualPinOverride(false);
      setDetailResolution(null);
      setAreaResolution(null);
      setResolvedPinLabel("");
      setViewportState(toViewportState(DEFAULT_PROPERTY_COORDINATES, DEFAULT_MAP_ZOOM, null));
      setResolvedLocationState(createDefaultResolvedLocationState());

      onChange({
        ward: ward?.name || "",
        wardCode: ward?.code || "",
        latitude: DEFAULT_PROPERTY_COORDINATES[0],
        longitude: DEFAULT_PROPERTY_COORDINATES[1],
      });
    },
    [availableWards, invalidatePendingRequests, onChange]
  );

  const handleStreetAddressChange = useCallback(
    (streetAddress: string) => {
      if (detailDebounceRef.current !== null) {
        window.clearTimeout(detailDebounceRef.current);
        detailDebounceRef.current = null;
      }

      if (lastStage === "detail") {
        requestIdRef.current += 1;
        activeControllerRef.current?.abort();
        activeControllerRef.current = null;
        setIsGeocoding(false);
        setLastStage(null);
      }

      setDetailResolution(null);
      onChange({ streetAddress });

      if (!normalizeVietnamStreetAddressInput(streetAddress, value.ward, value.city) && !hasManualPinOverride) {
        restoreAreaFallback();
      }
    },
    [hasManualPinOverride, lastStage, onChange, restoreAreaFallback, value.city, value.ward]
  );

  const handleManualCoordinatesChange = useCallback(
    async (latitude: number, longitude: number, options?: { refreshLabel?: boolean }) => {
      invalidatePendingRequests();
      setHasManualPinOverride(true);
      setDetailResolution(null);
      setResolvedLocationState({
        markerLat: latitude,
        markerLng: longitude,
        locationPrecision: "exact",
        locationConfidence: 1,
        requiresManualConfirmation: false,
        displayName: resolvedPinLabel,
      });
      setViewportState((current) =>
        toViewportState([latitude, longitude], Math.max(current.viewportZoom, 17), "manual")
      );
      commitCoordinatesIfChanged(latitude, longitude);

      if (!options?.refreshLabel) return;

      const { controller, requestId } = beginRequest("reverse");
      try {
        const reversed = await reverseGeocodeVietnamCoordinates({ lat: latitude, lon: longitude }, controller.signal);
        if (requestId !== requestIdRef.current) return;

        const displayName = reversed?.displayName || "";
        setResolvedPinLabel(displayName);
        setResolvedLocationState((current) => ({
          ...current,
          displayName,
        }));
      } catch {
        if (!controller.signal.aborted) {
          setResolvedPinLabel("");
        }
      } finally {
        finishRequest(requestId);
      }
    },
    [beginRequest, commitCoordinatesIfChanged, finishRequest, invalidatePendingRequests, resolvedPinLabel]
  );

  const handleUseCurrentLocation = useCallback(async () => {
    const location = await getBestAvailableLocation();
    await handleManualCoordinatesChange(location.lat, location.lng, { refreshLabel: true });
  }, [handleManualCoordinatesChange]);

  const locationStatus = useMemo<PropertyLocationStatus>(() => {
    const bestResolution = detailResolution || areaResolution;
    const hasTypedStreet = Boolean(normalizedStreetAddress);
    const precision = resolvedLocationState.locationPrecision || (value.ward ? "ward" : "province");
    const requiresManualPinConfirmation = hasManualPinOverride
      ? false
      : hasTypedStreet
        ? !detailResolution || resolvedLocationState.requiresManualConfirmation
        : resolvedLocationState.requiresManualConfirmation;

    return {
      precision,
      confidence: resolvedLocationState.locationConfidence || bestResolution?.confidence || 0,
      requiresManualPinConfirmation,
      hasManualPinOverride,
      resolvedLabel: resolvedPinLabel,
      normalizedStreetAddress,
      viewportSource: viewportState.viewportSource,
    };
  }, [
    areaResolution,
    detailResolution,
    hasManualPinOverride,
    normalizedStreetAddress,
    resolvedLocationState.locationConfidence,
    resolvedLocationState.locationPrecision,
    resolvedLocationState.requiresManualConfirmation,
    resolvedPinLabel,
    value.ward,
    viewportState.viewportSource,
  ]);

  return {
    provinces,
    availableWards,
    isLocationsLoading,
    isGeocoding,
    lastStage,
    viewportState,
    resolvedLocationState,
    resolvedPinLabel,
    locationStatus,
    selectedProvinceCode: selectedProvince?.code || value.cityCode,
    selectedWardCode: selectedWard?.code || value.wardCode,
    handleProvinceChange,
    handleWardChange,
    handleStreetAddressChange,
    handleManualCoordinatesChange,
    handleUseCurrentLocation,
  };
}
