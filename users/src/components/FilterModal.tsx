"use client";

import { useState, useEffect } from "react";
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
    bathroomType: "khép kín" | "chung" | null;
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
    bathroomType: null,
};

interface Props {
    visible: boolean;
    onClose: () => void;
    filters: FilterOptions;
    applyFilters: (f: FilterOptions) => void;
}

const formatWithDots = (val: number | null) => {
    if (val === null) return "";
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseWithDots = (val: string) => {
    // Remove all non-numeric characters except dots (though we only want to strip dots)
    const raw = val.replace(/\./g, "").replace(/[^\d]/g, "");
    if (!raw) return null;
    const num = parseInt(raw, 10);
    return isNaN(num) ? null : num;
};

export default function FilterModal({ visible, onClose, filters, applyFilters }: Props) {
    const { t } = useLanguage();
    const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

    // Use JSON data or state as requested instead of mock data
    const [provincesList, setProvincesList] = useState<any[]>([]);
    const [wardsData, setWardsData] = useState<any[]>([]);

    useEffect(() => {
        // Corrected: provinces should be from province.json, wards from ward.json
        fetch('/data/province.json')
            .then(res => res.json())
            .then(data => {
                const list = Array.isArray(data) ? data : Object.values(data);
                setProvincesList(list);
            })
            .catch(() => { });

        fetch('/data/ward.json')
            .then(res => res.json())
            .then(data => {
                const list = Array.isArray(data) ? data : Object.values(data);
                setWardsData(list);
            })
            .catch(() => { });
    }, []);

    const selectedProvinceCode = provincesList.find(p => p.name === localFilters.province)?.code;
    const availableWards = wardsData
        .filter(w => w.parent_code === selectedProvinceCode)
        .sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }));


    useEffect(() => {
        if (visible) setLocalFilters(filters);
    }, [visible, filters]);

    if (!visible) return null;

    const handleApply = () => {
        applyFilters(localFilters);
        onClose();
    };

    const handleReset = () => {
        setLocalFilters(DEFAULT_FILTERS);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300">
            {/* Modal Container */}
            <div className="bg-white w-full sm:w-[500px] h-auto max-h-[90vh] sm:rounded-2xl rounded-t-2xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-5">

                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                    <h2 className="text-lg font-bold text-gray-900">{t("advanced_filter")}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
                        <X size={24} className="text-gray-600" />
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

                    {/* Price Range */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-gray-800 text-sm">{t("price_range")}</h3>
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder={t("from")}
                                className="flex-1 w-full border border-gray-300 bg-gray-50 text-gray-900 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-400"
                                value={formatWithDots(localFilters.minPrice)}
                                onChange={(e) => {
                                    const val = parseWithDots(e.target.value);
                                    setLocalFilters(p => ({ ...p, minPrice: val }));
                                }}
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder={t("to")}
                                className="flex-1 w-full border border-gray-300 bg-gray-50 text-gray-900 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-400"
                                value={formatWithDots(localFilters.maxPrice)}
                                onChange={(e) => {
                                    const val = parseWithDots(e.target.value);
                                    setLocalFilters(p => ({ ...p, maxPrice: val }));
                                }}
                            />
                        </div>
                    </div>

                    {/* Area Dropdowns */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-gray-800 text-sm">{t("location_area")}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <select
                                className="w-full border border-gray-300 bg-gray-50 text-gray-900 text-sm rounded-lg px-3 py-2 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                                value={localFilters.province || ""}
                                onChange={(e) => setLocalFilters(p => ({ ...p, province: e.target.value || null, ward: null }))}
                            >
                                <option value="">{t("province_city")}</option>
                                {provincesList.map(p => (
                                    <option key={p.code} value={p.name}>{p.name}</option>
                                ))}
                            </select>

                            <select
                                className="w-full border border-gray-300 bg-gray-50 text-gray-900 text-sm rounded-lg px-3 py-2 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                                value={localFilters.ward || ""}
                                onChange={(e) => setLocalFilters(p => ({ ...p, ward: e.target.value || null }))}
                                disabled={!localFilters.province}
                            >
                                <option value="">{t("ward_commune")}</option>
                                {availableWards.map(w => (
                                    <option key={w.code} value={w.name}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Bedrooms Minimum */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-gray-800 text-sm">{t("min_bedrooms")}</h3>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4].map(n => (
                                <button
                                    key={n}
                                    onClick={() => setLocalFilters(p => ({ ...p, minBedrooms: p.minBedrooms === n ? null : n }))}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition border ${localFilters.minBedrooms === n
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {n}+
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Room Area */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-gray-800 text-sm">{t("area_m2")}</h3>
                        <div className="flex items-center gap-3 max-w-[220px]">
                            <input
                                type="number"
                                placeholder={t("from")}
                                className="flex-1 w-full border border-gray-300 bg-gray-50 text-gray-900 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-400"
                                value={localFilters.minArea || ""}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setLocalFilters(p => ({ ...p, minArea: isNaN(val) ? null : val }));
                                }}
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="number"
                                placeholder={t("to")}
                                className="flex-1 w-full border border-gray-300 bg-gray-50 text-gray-900 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-400"
                                value={localFilters.maxArea || ""}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setLocalFilters(p => ({ ...p, maxArea: isNaN(val) ? null : val }));
                                }}
                            />
                        </div>
                    </div>

                </div>

                {/* Footer Buttons */}
                <div className="p-4 border-t border-gray-200 bg-white flex gap-3 sticky bottom-0 z-10">
                    <button
                        onClick={handleReset}
                        className="flex-1 py-3.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                    >
                        {t("reset")}
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-[2] py-3.5 rounded-xl bg-blue-600 text-white font-bold shadow-sm hover:bg-blue-700 transition"
                    >
                        {t("apply")}
                    </button>
                </div>

            </div>
        </div>
    );
}
