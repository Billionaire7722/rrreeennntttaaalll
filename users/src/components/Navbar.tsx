"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { Search, Filter, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import FilterModal, { FilterOptions, DEFAULT_FILTERS } from './FilterModal';

interface NavbarProps {
    onFilterChange?: (filters: FilterOptions) => void;
}

export default function Navbar({ onFilterChange }: NavbarProps = {}) {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);

    useEffect(() => {
        if (onFilterChange) {
            onFilterChange({ ...filters, searchQuery });
        }
    }, [searchQuery, filters]);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 h-[60px] flex items-center justify-between px-3 sm:px-4 w-full">
            {/* Left: User Greeting */}
            <div className="flex-1 hidden sm:flex">
                <span className="text-sm font-medium text-gray-800 truncate max-w-[120px]">
                    {t("hello")}, {user ? user.name || t("guest") : t("guest")}
                </span>
            </div>
            <div className="flex-1 sm:hidden" />

            {/* Center: Search Bar & Filter */}
            <div className="flex flex-row items-center gap-2 w-[200px] sm:w-[280px] md:w-[360px]">
                <div className="flex-1 flex flex-row items-center bg-gray-100 rounded-lg px-2.5 h-9 min-w-0">
                    <Search size={16} className="text-gray-500 flex-shrink-0" />
                    <input
                        className="flex-1 ml-2 text-sm text-gray-800 bg-transparent outline-none placeholder-gray-500 min-w-0"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setIsFilterOpen(true)}
                    className="bg-teal-600 w-9 h-9 rounded-lg flex justify-center items-center flex-shrink-0 hover:bg-teal-700 transition"
                >
                    <Filter size={18} className="text-white" />
                </button>
            </div>

            {/* Right: Logout / Login */}
            <div className="flex-1 flex items-center justify-end gap-1 sm:gap-2">
                {user ? (
                    <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg transition">
                        <LogOut size={18} className="text-gray-500" />
                    </button>
                ) : (
                    <button onClick={() => router.push('/login')} className="p-2 hover:bg-gray-100 rounded-lg transition">
                        <User size={18} className="text-gray-500" />
                    </button>
                )}
            </div>

            <FilterModal
                visible={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={filters}
                applyFilters={setFilters}
            />
        </nav>
    );
}
