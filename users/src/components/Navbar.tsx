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
    }, [searchQuery, filters, onFilterChange]);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    return (
        <nav className="sticky top-0 z-50 flex h-[60px] w-full items-center justify-between border-b border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 backdrop-blur sm:px-4">
            {/* Left: User Greeting */}
            <div className="flex-1 flex">
                <span className="max-w-[80px] truncate text-sm font-medium text-[var(--theme-text)] sm:max-w-[120px]">
                    {t("hello")}, {user ? user.firstName || user.name || t("guest") : t("guest")}
                </span>
            </div>

            {/* Center: Search Bar & Filter */}
            <div className="flex w-[200px] flex-row items-center gap-2 sm:w-[280px] md:w-[360px]">
                <div id="tour-search" className="flex h-9 min-w-0 flex-1 flex-row items-center rounded-lg bg-[var(--theme-surface-2)] px-2.5">
                    <Search size={16} className="flex-shrink-0 text-[var(--theme-text-muted)]" />
                    <input
                        className="ml-2 min-w-0 flex-1 bg-transparent text-sm text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-text-muted)]"
                        placeholder={t("search_placeholder")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button
                    id="tour-filter"
                    onClick={() => setIsFilterOpen(true)}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-teal-600 transition hover:bg-teal-700"
                >
                    <Filter size={18} className="text-white" />
                </button>
            </div>

            {/* Right: Logout / Login */}
            <div className="flex-1 flex items-center justify-end gap-1 sm:gap-2">
                {user ? (
                    <button onClick={handleLogout} className="rounded-lg p-2 transition hover:bg-[var(--theme-surface-2)]">
                        <LogOut size={18} className="text-[var(--theme-text-muted)]" />
                    </button>
                ) : (
                    <button onClick={() => router.push('/login')} className="rounded-lg p-2 transition hover:bg-[var(--theme-surface-2)]">
                        <User size={18} className="text-[var(--theme-text-muted)]" />
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
