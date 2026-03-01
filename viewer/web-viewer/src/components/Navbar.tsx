"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/useAuth';
import { Search, Filter, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import FilterModal, { FilterOptions, DEFAULT_FILTERS } from './FilterModal';

interface NavbarProps {
    onFilterChange?: (filters: FilterOptions) => void;
}

export default function Navbar({ onFilterChange }: NavbarProps = {}) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);

    // Debounce or immediate apply search
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
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 h-[60px] flex items-center px-4 w-full">
            {/* Left: User Greeting */}
            <div className="flex-1 flex justify-start">
                {user ? (
                    <span className="text-sm font-medium text-gray-800 truncate">
                        Xin chào, {user.name || 'User'}
                    </span>
                ) : (
                    <span className="text-sm font-medium text-gray-800 truncate">
                        Xin chào, Khách
                    </span>
                )}
            </div>

            {/* Center: Search Bar & Filter */}
            <div className="flex-[2] flex flex-row items-center justify-center gap-2 max-w-[400px]">
                <div className="flex-1 flex flex-row items-center bg-gray-100 rounded-lg px-2.5 h-9">
                    <Search size={16} className="text-gray-500" />
                    <input
                        className="flex-1 ml-2 text-sm text-gray-800 bg-transparent outline-none placeholder-gray-500"
                        placeholder="Tìm kiếm nhà thuê..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setIsFilterOpen(true)}
                    className="bg-blue-600 w-9 h-9 rounded-lg flex justify-center items-center flex-shrink-0 hover:bg-blue-700 transition"
                >
                    <Filter size={18} className="text-white" />
                </button>
            </div>

            {/* Right: Logout / Login */}
            <div className="flex-1 flex justify-end items-center gap-1">
                {user ? (
                    <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-full transition">
                        <LogOut size={18} className="text-gray-500" />
                    </button>
                ) : (
                    <button onClick={() => router.push('/login')} className="p-2 hover:bg-gray-100 rounded-full transition">
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
