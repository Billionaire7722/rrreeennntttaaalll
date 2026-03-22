"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export type FilterOptions = {
  searchQuery: string;
  minPrice: number | null;
  maxPrice: number | null;
  province: string | null;
  ward: string | null;
  minBedrooms: number | null;
  minArea: number | null;
  maxArea: number | null;
};

export const DEFAULT_FILTERS: FilterOptions = {
  searchQuery: "",
  minPrice: null,
  maxPrice: null,
  province: null,
  ward: null,
  minBedrooms: null,
  minArea: null,
  maxArea: null,
};

interface Props {
  visible: boolean;
  onClose: () => void;
  filters: FilterOptions;
  applyFilters: (filters: FilterOptions) => void;
}

const formatWithDots = (value: number | null) => {
  if (value === null) return "";
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseWithDots = (value: string) => {
  const raw = value.replace(/\./g, "").replace(/[^\d]/g, "");
  if (!raw) return null;

  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export default function FilterModal({ visible, onClose, filters, applyFilters }: Props) {
  const { t, localeTag } = useLanguage();
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);
  const [provincesList, setProvincesList] = useState<any[]>([]);
  const [wardsData, setWardsData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/data/province.json")
      .then((response) => response.json())
      .then((data) => setProvincesList(Array.isArray(data) ? data : Object.values(data)))
      .catch(() => {});

    fetch("/data/ward.json")
      .then((response) => response.json())
      .then((data) => setWardsData(Array.isArray(data) ? data : Object.values(data)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (visible) setLocalFilters(filters);
  }, [filters, visible]);

  if (!visible) return null;

  const selectedProvinceCode = provincesList.find((province) => province.name === localFilters.province)?.code;
  const availableWards = wardsData
    .filter((ward) => ward.parent_code === selectedProvinceCode)
    .sort((first, second) => first.name.localeCompare(second.name, localeTag, { sensitivity: "base" }));

  const handleApply = () => {
    applyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters(DEFAULT_FILTERS);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur-sm transition-all duration-300 sm:px-4 sm:pb-4 sm:pt-6">
      <div className="mt-auto w-full max-w-md overflow-hidden rounded-[1.5rem] bg-white shadow-2xl animate-in slide-in-from-bottom-4">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">{t("property.filters.title")}</h2>
          <button onClick={onClose} className="rounded-full p-2 transition hover:bg-gray-100">
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        <div className="max-h-[min(62dvh,30rem)] space-y-6 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">{t("property.filters.priceRange")}</h3>
            <div className="flex items-center gap-3">
              <input
                type="text"
                inputMode="numeric"
                placeholder={t("common.from")}
                className="w-full flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none placeholder-gray-400 focus:bg-white focus:ring-1 focus:ring-blue-500"
                value={formatWithDots(localFilters.minPrice)}
                onChange={(event) => {
                  const value = parseWithDots(event.target.value);
                  setLocalFilters((previous) => ({ ...previous, minPrice: value }));
                }}
              />
              <span className="text-gray-400">-</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder={t("common.to")}
                className="w-full flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none placeholder-gray-400 focus:bg-white focus:ring-1 focus:ring-blue-500"
                value={formatWithDots(localFilters.maxPrice)}
                onChange={(event) => {
                  const value = parseWithDots(event.target.value);
                  setLocalFilters((previous) => ({ ...previous, maxPrice: value }));
                }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">{t("property.filters.locationArea")}</h3>
            <div className="grid grid-cols-1 gap-3">
              <select
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                value={localFilters.province || ""}
                onChange={(event) =>
                  setLocalFilters((previous) => ({
                    ...previous,
                    province: event.target.value || null,
                    ward: null,
                  }))
                }
              >
                <option value="">{t("property.filters.provinceCity")}</option>
                {provincesList.map((province) => (
                  <option key={province.code} value={province.name}>
                    {province.name}
                  </option>
                ))}
              </select>

              <select
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                value={localFilters.ward || ""}
                disabled={!localFilters.province}
                onChange={(event) => setLocalFilters((previous) => ({ ...previous, ward: event.target.value || null }))}
              >
                <option value="">{t("property.form.districtLabel")}</option>
                {availableWards.map((ward) => (
                  <option key={ward.code} value={ward.name}>
                    {ward.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">{t("property.filters.minBedrooms")}</h3>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((value) => (
                <button
                  key={value}
                  onClick={() =>
                    setLocalFilters((previous) => ({
                      ...previous,
                      minBedrooms: previous.minBedrooms === value ? null : value,
                    }))
                  }
                  className={`rounded-lg border px-4 py-1.5 text-xs font-semibold transition ${
                    localFilters.minBedrooms === value
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {value}+
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">{t("property.fields.area")}</h3>
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder={t("common.from")}
                className="w-full flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none placeholder-gray-400 focus:bg-white focus:ring-1 focus:ring-blue-500"
                value={localFilters.minArea || ""}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10);
                  setLocalFilters((previous) => ({ ...previous, minArea: Number.isNaN(value) ? null : value }));
                }}
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                placeholder={t("common.to")}
                className="w-full flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none placeholder-gray-400 focus:bg-white focus:ring-1 focus:ring-blue-500"
                value={localFilters.maxArea || ""}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10);
                  setLocalFilters((previous) => ({ ...previous, maxArea: Number.isNaN(value) ? null : value }));
                }}
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-10 flex gap-3 border-t border-gray-200 bg-white p-4">
          <button
            onClick={handleReset}
            className="flex-1 rounded-xl border border-gray-300 py-3.5 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            {t("common.reset")}
          </button>
          <button
            onClick={handleApply}
            className="flex-[2] rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            {t("common.apply")}
          </button>
        </div>
      </div>
    </div>
  );
}
