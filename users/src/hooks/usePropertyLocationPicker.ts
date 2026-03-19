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

type GeocodingStage = "province" | "ward" | "detail" | "reverse" | null;

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

type MapState = {
  center: [number, number];
  zoom: number;
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
};

function hasValidCoordinates(latitude: number, longitude: number) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && !(latitude === 0 && longitude === 0);
}

export function usePropertyLocationPicker({ isOpen, value, onChange }: UsePropertyLocationPickerOptions) {
  const [provinces, setProvinces] = useState<VietnamProvince[]>([]);
  const [wards, setWards] = useState<VietnamWard[]>([]);
  const [isLocationsLoading, setIsLocationsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapState, setMapState] = useState<MapState>({
    center: DEFAULT_PROPERTY_COORDINATES,
    zoom: DEFAULT_MAP_ZOOM,
  });
  const [resolvedPinLabel, setResolvedPinLabel] = useState("");
  const [lastResolution, setLastResolution] = useState<LocationResolution | null>(null);
  const [hasManualPinOverride, setHasManualPinOverride] = useState(false);
  const [lastStage, setLastStage] = useState<GeocodingStage>(null);
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
    if (!isOpen) return;

    const latitude = value.latitude;
    const longitude = value.longitude;
    if (hasValidCoordinates(latitude, longitude)) {
      setMapState({
        center: [latitude, longitude],
        zoom: value.streetAddress ? 17 : value.ward ? 14 : value.city ? 11 : DEFAULT_MAP_ZOOM,
      });
      return;
    }

    setMapState({
      center: DEFAULT_PROPERTY_COORDINATES,
      zoom: DEFAULT_MAP_ZOOM,
    });
  }, [isOpen, value.city, value.latitude, value.longitude, value.streetAddress, value.ward]);

  useEffect(() => {
    if (!isOpen || provinces.length === 0) return;

    const selectedProvince = findProvinceByCode(provinces, value.cityCode) || findProvinceByName(provinces, value.city);
    const selectedWard =
      findWardByCode(wards, value.wardCode) ||
      findWardByName(wards, value.ward, selectedProvince?.code ?? value.cityCode ?? undefined);

      const patch: PropertyLocationPatch = {};
    if (selectedProvince && selectedProvince.code !== value.cityCode) {
      patch.cityCode = selectedProvince.code;
    }
    if (selectedProvince && selectedProvince.name !== value.city) {
      patch.city = selectedProvince.name;
    }
    if (selectedWard && selectedWard.code !== value.wardCode) {
      patch.wardCode = selectedWard.code;
    }
    if (selectedWard && selectedWard.name !== value.ward) {
      patch.ward = selectedWard.name;
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

  const availableWards = useMemo(() => {
    const provinceCode = selectedProvince?.code ?? value.cityCode;
    if (!provinceCode) return [];

    return wards
      .filter((ward) => String(ward.parent_code) === String(provinceCode))
      .sort((first, second) => first.name.localeCompare(second.name, "vi", { sensitivity: "base" }));
  }, [selectedProvince?.code, value.cityCode, wards]);

  const cancelPendingWork = useCallback(() => {
    if (detailDebounceRef.current !== null) {
      window.clearTimeout(detailDebounceRef.current);
      detailDebounceRef.current = null;
    }

    activeControllerRef.current?.abort();
    activeControllerRef.current = null;
  }, []);

  useEffect(() => cancelPendingWork, [cancelPendingWork]);

  const beginRequest = useCallback((stage: GeocodingStage) => {
    cancelPendingWork();
    const controller = new AbortController();
    activeControllerRef.current = controller;
    requestIdRef.current += 1;
    setIsGeocoding(true);
    setLastStage(stage);
    if (stage !== "reverse") {
      setResolvedPinLabel("");
    }
    return { controller, requestId: requestIdRef.current };
  }, [cancelPendingWork]);

  const finishRequest = useCallback((requestId: number) => {
    if (requestId === requestIdRef.current) {
      setIsGeocoding(false);
      setLastStage(null);
      activeControllerRef.current = null;
    }
  }, []);

  const applyResolvedLocation = useCallback(
    (requestId: number, patch: PropertyLocationPatch, nextMapState: MapState, resolution: LocationResolution) => {
      if (requestId !== requestIdRef.current) return false;

      setHasManualPinOverride(false);
      setLastResolution(resolution);
      setResolvedPinLabel(resolution.displayName);
      onChange(patch);
      setMapState(nextMapState);
      return true;
    },
    [onChange]
  );

  const resolveProvinceStage = useCallback(
    async (nextCity: string) => {
      if (!nextCity.trim()) {
        cancelPendingWork();
        onChange({
          city: "",
          cityCode: "",
          ward: "",
          wardCode: "",
        });
        setMapState({ center: DEFAULT_PROPERTY_COORDINATES, zoom: DEFAULT_MAP_ZOOM });
        return;
      }

      const { controller, requestId } = beginRequest("province");

      try {
        const result = await resolveVietnamProvinceCenter(nextCity, controller.signal);
        if (!result) return;

        applyResolvedLocation(
          requestId,
          {
            latitude: result.lat,
            longitude: result.lon,
          },
          { center: [result.lat, result.lon], zoom: result.zoom },
          result
        );
      } catch {
        if (!controller.signal.aborted) {
          setResolvedPinLabel("");
        }
      } finally {
        finishRequest(requestId);
      }
    },
    [applyResolvedLocation, beginRequest, cancelPendingWork, finishRequest, onChange]
  );

  const resolveWardStage = useCallback(
    async (nextWard: string, nextCity: string) => {
      if (!nextCity.trim()) return;

      const { controller, requestId } = beginRequest("ward");

      try {
        const result = await resolveVietnamWardCenter({ ward: nextWard, city: nextCity }, controller.signal);
        if (!result) return;

        applyResolvedLocation(
          requestId,
          {
            latitude: result.lat,
            longitude: result.lon,
          },
          { center: [result.lat, result.lon], zoom: result.zoom },
          result
        );
      } catch {
        if (!controller.signal.aborted) {
          setResolvedPinLabel("");
        }
      } finally {
        finishRequest(requestId);
      }
    },
    [applyResolvedLocation, beginRequest, finishRequest]
  );

  const scheduleDetailResolution = useCallback(
    (nextValue: PropertyLocationFormValue) => {
      if (!nextValue.city.trim()) return;

      if (detailDebounceRef.current !== null) {
        window.clearTimeout(detailDebounceRef.current);
      }

      detailDebounceRef.current = window.setTimeout(async () => {
        const { controller, requestId } = beginRequest("detail");

        try {
          const result = await resolveVietnamDetailedAddress(
            {
              streetAddress: nextValue.streetAddress,
              ward: nextValue.ward,
              city: nextValue.city,
            },
            controller.signal
          );

          if (!result) return;

          applyResolvedLocation(
            requestId,
            {
              streetAddress: result.normalizedStreetAddress,
              latitude: result.lat,
              longitude: result.lon,
            },
            { center: [result.lat, result.lon], zoom: result.zoom },
            result
          );
        } catch {
          if (!controller.signal.aborted) {
            setResolvedPinLabel("");
          }
        } finally {
          finishRequest(requestId);
        }
      }, DETAIL_GEOCODE_DEBOUNCE_MS);
    },
    [applyResolvedLocation, beginRequest, finishRequest]
  );

  const handleProvinceChange = useCallback(
    async (provinceCode: string) => {
      const province = findProvinceByCode(provinces, provinceCode);
      const nextCity = province?.name || "";

      setHasManualPinOverride(false);
      setLastResolution(null);
      setResolvedPinLabel("");
      onChange({
        city: nextCity,
        cityCode: province?.code || "",
        ward: "",
        wardCode: "",
      });

      await resolveProvinceStage(nextCity);
    },
    [onChange, provinces, resolveProvinceStage]
  );

  const handleWardChange = useCallback(
    async (wardCode: string) => {
      const ward = findWardByCode(availableWards, wardCode);
      const nextWard = ward?.name || "";

      setHasManualPinOverride(false);
      setLastResolution(null);
      setResolvedPinLabel("");
      onChange({
        ward: nextWard,
        wardCode: ward?.code || "",
      });

      await resolveWardStage(nextWard, value.city);
    },
    [availableWards, onChange, resolveWardStage, value.city]
  );

  const handleStreetAddressChange = useCallback(
    (streetAddress: string) => {
      const normalizedStreetAddress = normalizeVietnamStreetAddressInput(streetAddress, value.ward, value.city);
      const nextValue = {
        ...value,
        streetAddress: normalizedStreetAddress,
      };

      setHasManualPinOverride(false);
      setLastResolution(null);
      setResolvedPinLabel("");
      onChange({ streetAddress: normalizedStreetAddress });

      if (normalizedStreetAddress.trim()) {
        scheduleDetailResolution(nextValue);
        return;
      }

      if (value.ward.trim()) {
        void resolveWardStage(value.ward, value.city);
        return;
      }

      if (value.city.trim()) {
        void resolveProvinceStage(value.city);
      }
    },
    [onChange, resolveProvinceStage, resolveWardStage, scheduleDetailResolution, value]
  );

  const handleManualCoordinatesChange = useCallback(
    async (latitude: number, longitude: number, options?: { refreshLabel?: boolean }) => {
      cancelPendingWork();
      setHasManualPinOverride(true);
      onChange({ latitude, longitude });
      setMapState((current) => ({
        center: [latitude, longitude],
        zoom: Math.max(current.zoom, 17),
      }));

      if (!options?.refreshLabel) return;

      const { controller, requestId } = beginRequest("reverse");
      try {
        const reversed = await reverseGeocodeVietnamCoordinates({ lat: latitude, lon: longitude }, controller.signal);
        if (requestId === requestIdRef.current) {
          setResolvedPinLabel(reversed?.displayName || "");
          setLastResolution((previous) =>
            previous
              ? {
                  ...previous,
                  lat: latitude,
                  lon: longitude,
                  displayName: reversed?.displayName || previous.displayName,
                }
              : null
          );
        }
      } catch {
        if (!controller.signal.aborted) {
          setResolvedPinLabel("");
        }
      } finally {
        finishRequest(requestId);
      }
    },
    [beginRequest, cancelPendingWork, finishRequest, onChange]
  );

  const handleUseCurrentLocation = useCallback(async () => {
    const location = await getBestAvailableLocation();
    await handleManualCoordinatesChange(location.lat, location.lng, { refreshLabel: true });
  }, [handleManualCoordinatesChange]);

  const locationStatus = useMemo<PropertyLocationStatus>(() => {
    const normalizedStreetAddress = normalizeVietnamStreetAddressInput(value.streetAddress, value.ward, value.city);
    const resolution = lastResolution;
    const hasTypedStreet = Boolean(normalizedStreetAddress);
    const derivedPrecision: LocationPrecision = resolution?.precision || (value.ward ? "ward" : "province");
    const requiresManualPinConfirmation = resolution
      ? resolution.requiresManualConfirmation && !hasManualPinOverride
      : hasTypedStreet && !hasManualPinOverride;

    return {
      precision: derivedPrecision,
      confidence: resolution?.confidence || 0,
      requiresManualPinConfirmation,
      hasManualPinOverride,
      resolvedLabel: resolvedPinLabel,
      normalizedStreetAddress,
    };
  }, [hasManualPinOverride, lastResolution, resolvedPinLabel, value.city, value.streetAddress, value.ward]);

  return {
    provinces,
    availableWards,
    isLocationsLoading,
    isGeocoding,
    lastStage,
    mapState,
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
