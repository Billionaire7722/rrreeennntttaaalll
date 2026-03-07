"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/useAuth';
import { useLanguage, Language } from '@/context/LanguageContext';
import { Search, Filter, LogOut, User, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import FilterModal, { FilterOptions, DEFAULT_FILTERS } from './FilterModal';

interface NavbarProps {
    onFilterChange?: (filters: FilterOptions) => void;
}

const FLAGS: Record<Language, { url: string, label: string }> = {
    vi: { url: "https://flagcdn.com/w20/vn.png", label: "Tiếng Việt" },
    en: { url: "https://flagcdn.com/w20/gb.png", label: "English" },
    zh: { url: "https://flagcdn.com/w20/cn.png", label: "中文" },
    es: { url: "https://flagcdn.com/w20/es.png", label: "Español" },
};

export default function Navbar({ onFilterChange }: NavbarProps = {}) {
    const { user, logout } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);

    // Dropdown state
    const [isLangOpen, setIsLangOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (onFilterChange) {
            onFilterChange({ ...filters, searchQuery });
        }
    }, [searchQuery, filters]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsLangOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 h-[60px] flex items-center px-3 sm:px-4 w-full gap-2 sm:gap-3">
            {/* Left: User Greeting - hidden on small screens */}
            <div className="hidden sm:flex flex-shrink-0">
                <span className="text-sm font-medium text-gray-800 truncate max-w-[120px]">
                    {t("hello")}, {user ? user.name || t("guest") : t("guest")}
                </span>
            </div>

            {/* Center: Search Bar & Filter */}
            <div className="flex-1 flex flex-row items-center gap-2 min-w-0">
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

            {/* Right: Language Dropdown and Logout / Login */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">

                {/* Language Switcher */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsLangOpen(!isLangOpen)}
                        className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition"
                    >
                        <img src={FLAGS[language].url} alt={language} className="w-5 h-auto rounded-sm" />
                        <ChevronDown size={14} className={`text-gray-500 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isLangOpen && (
                        <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-lg shadow-xl border border-gray-200 py-1 overflow-hidden z-[100]">
                            {(Object.entries(FLAGS) as [Language, { url: string, label: string }][]).map(([key, flag]) => (
                                <button
                                    key={key}
                                    onClick={() => { setLanguage(key); setIsLangOpen(false); }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${language === key ? 'bg-teal-50 text-teal-600 font-medium' : 'text-gray-700'}`}
                                >
                                    <img src={flag.url} alt={key} className="w-5 h-auto rounded-sm" />
                                    <span>{flag.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

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
