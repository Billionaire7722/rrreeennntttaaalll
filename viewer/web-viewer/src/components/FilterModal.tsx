"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

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
    status: string | null;
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
    status: null,
};

interface Props {
    visible: boolean;
    onClose: () => void;
    filters: FilterOptions;
    applyFilters: (f: FilterOptions) => void;
}

export default function FilterModal({ visible, onClose, filters, applyFilters }: Props) {
    const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

    // Simulate static JSON data loading like the mobile array for demo/simplicity
    const provincesList = [{ code: "01", name: "Thành phố Hà Nội" }, { code: "79", name: "Thành phố Hồ Chí Minh" }];
    const wardsList = [{ parent_code: "01", code: "001", name: "Quận Ba Đình" }, { parent_code: "01", code: "002", name: "Quận Hoàn Kiếm" }, { parent_code: "79", code: "760", name: "Quận 1" }, { parent_code: "79", code: "762", name: "Quận 3" }];

    const selectedProvinceCode = provincesList.find(p => p.name === localFilters.province)?.code;
    const availableWards = wardsList.filter(w => w.parent_code === selectedProvinceCode);

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
            <div className="bg-white w-full sm:w-[600px] h-[85vh] sm:h-[80vh] sm:rounded-2xl rounded-t-2xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-5">

                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                    <h2 className="text-lg font-bold text-gray-900">Bộ lọc nâng cao</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
                        <X size={24} className="text-gray-600" />
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

                    {/* Price Range */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-gray-900 text-[15px]">Mức giá (VNĐ)</h3>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                placeholder="Từ..."
                                className="flex-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={localFilters.minPrice || ""}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setLocalFilters(p => ({ ...p, minPrice: isNaN(val) ? null : val }));
                                }}
                            />
                            <span className="text-gray-500 font-medium">-</span>
                            <input
                                type="number"
                                placeholder="Đến..."
                                className="flex-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={localFilters.maxPrice || ""}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setLocalFilters(p => ({ ...p, maxPrice: isNaN(val) ? null : val }));
                                }}
                            />
                        </div>
                    </div>

                    {/* Area Dropdowns */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-gray-900 text-[15px]">Khu vực</h3>
                        <div className="flex flex-col gap-3">
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={localFilters.province || ""}
                                onChange={(e) => setLocalFilters(p => ({ ...p, province: e.target.value || null, ward: null }))}
                            >
                                <option value="">Tỉnh / Thành phố</option>
                                {provincesList.map(p => (
                                    <option key={p.code} value={p.name}>{p.name}</option>
                                ))}
                            </select>

                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400"
                                value={localFilters.ward || ""}
                                onChange={(e) => setLocalFilters(p => ({ ...p, ward: e.target.value || null }))}
                                disabled={!localFilters.province}
                            >
                                <option value="">Quận / Huyện</option>
                                {availableWards.map(w => (
                                    <option key={w.code} value={w.name}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Bedrooms Minimum */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-gray-900 text-[15px]">Số phòng ngủ tối thiểu</h3>
                        <div className="flex gap-3">
                            {[1, 2, 3, 4].map(n => (
                                <button
                                    key={n}
                                    onClick={() => setLocalFilters(p => ({ ...p, minBedrooms: p.minBedrooms === n ? null : n }))}
                                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${localFilters.minBedrooms === n
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {n}+
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Room Area */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-gray-900 text-[15px]">Diện tích phòng (m2)</h3>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                placeholder="Từ..."
                                className="flex-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={localFilters.minArea || ""}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setLocalFilters(p => ({ ...p, minArea: isNaN(val) ? null : val }));
                                }}
                            />
                            <span className="text-gray-500 font-medium">-</span>
                            <input
                                type="number"
                                placeholder="Đến..."
                                className="flex-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={localFilters.maxArea || ""}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setLocalFilters(p => ({ ...p, maxArea: isNaN(val) ? null : val }));
                                }}
                            />
                        </div>
                    </div>

                    {/* Bathroom Type */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-gray-900 text-[15px]">Loại phòng</h3>
                        <div className="flex gap-3">
                            {["khép kín", "chung"].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setLocalFilters(p => ({ ...p, bathroomType: p.bathroomType === type ? null : type as any }))}
                                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition capitalize ${localFilters.bathroomType === type
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-3 pb-6">
                        <h3 className="font-semibold text-gray-900 text-[15px]">Trạng thái</h3>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setLocalFilters(p => ({ ...p, status: p.status === "available" ? null : "available" }))}
                                className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${localFilters.status === "available"
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Cho thuê
                            </button>
                            <button
                                onClick={() => setLocalFilters(p => ({ ...p, status: p.status === "rented" ? null : "rented" }))}
                                className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${localFilters.status === "rented"
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Đã thuê
                            </button>
                        </div>
                    </div>

                </div>

                {/* Footer Buttons */}
                <div className="p-4 border-t border-gray-200 bg-white flex gap-3 sticky bottom-0 z-10">
                    <button
                        onClick={handleReset}
                        className="flex-1 py-3.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                    >
                        Đặt lại
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-[2] py-3.5 rounded-xl bg-blue-600 text-white font-bold shadow-sm hover:bg-blue-700 transition"
                    >
                        Áp dụng
                    </button>
                </div>

            </div>
        </div>
    );
}
