import React, { useState, useMemo } from 'react';
import { LayoutGrid, List, AlignJustify, ChevronLeft, ChevronRight } from 'lucide-react';
import PropertyCard, { Property } from './PropertyCard';
import { useLanguage } from '@/context/LanguageContext';

interface PropertyListProps {
    properties: Property[];
    onEdit?: (property: Property) => void;
    onDelete?: (id: string) => void;
    onToggleFavorite?: (id: string) => void;
    favorites?: Set<string>;
    emptyIcon?: React.ReactNode;
    emptyTitle?: string;
    emptyDescription?: string;
    storageKey?: string;
}

type ViewMode = 'grid' | 'list' | 'compact';

export default function PropertyList({
    properties,
    onEdit,
    onDelete,
    onToggleFavorite,
    favorites = new Set(),
    emptyIcon,
    emptyTitle,
    emptyDescription,
    storageKey = 'property_list_view_mode'
}: PropertyListProps) {
    const { t } = useLanguage();
    const [viewMode, setViewMode] = useState<ViewMode>('compact');
    const [currentPage, setCurrentPage] = useState(1);

    // Load persisted viewMode
    React.useEffect(() => {
        const savedMode = localStorage.getItem(storageKey) as ViewMode;
        if (savedMode && ['grid', 'list', 'compact'].includes(savedMode)) {
            setViewMode(savedMode);
        }
    }, [storageKey]);

    // Save viewMode when changed
    const handleViewModeChange = (mode: ViewMode) => {
        setViewMode(mode);
        localStorage.setItem(storageKey, mode);
    };

    // Pagination logic
    const itemsPerPage = useMemo(() => {
        if (viewMode === 'grid') return 6;
        if (viewMode === 'list') return 8;
        return 12;
    }, [viewMode]);

    const totalPages = Math.ceil(properties.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = properties.slice(startIndex, startIndex + itemsPerPage);

    // Reset page when viewMode changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [viewMode]);

    if (properties.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <div className="mb-4 text-gray-300">{emptyIcon}</div>
                <h3 className="text-base font-bold text-gray-800 mb-1">{emptyTitle || t('no_properties_found')}</h3>
                <p className="text-sm text-gray-400 max-w-xs">{emptyDescription}</p>
            </div>
        );
    }

    const SwitcherButton = ({ mode, icon: Icon, label }: { mode: ViewMode, icon: any, label: string }) => (
        <button
            onClick={() => handleViewModeChange(mode)}
            className={`p-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === mode 
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title={label}
        >
            <Icon size={16} />
            <span className={`text-xs font-bold ${viewMode === mode ? 'block' : 'hidden md:block'}`}>{label}</span>
        </button>
    );

    return (
        <div className="space-y-6">
            {/* Header with Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('display_mode') || 'Display Mode'}</span>
                    <div className="flex p-1 bg-white border border-gray-100 rounded-xl shadow-sm">
                        <SwitcherButton mode="grid" icon={LayoutGrid} label="Grid" />
                        <SwitcherButton mode="list" icon={List} label="List" />
                        <SwitcherButton mode="compact" icon={AlignJustify} label="Compact" />
                    </div>
                </div>
                <div className="text-xs text-gray-400 font-medium">
                    Showing <span className="text-gray-900 font-bold">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, properties.length)}</span> of <span className="text-gray-900 font-bold">{properties.length}</span>
                </div>
            </div>

            {/* Property Grid/List */}
            <div className={`grid gap-4 transition-all duration-300 ${
                viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
                {currentItems.map((property) => (
                    <div key={property.id} className="animate-in fade-in duration-500">
                        <PropertyCard
                            property={property}
                            variant={viewMode}
                            isFavorite={favorites.has(property.id)}
                            onToggleFavorite={onToggleFavorite}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    </div>
                ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-xl border border-gray-100 bg-white text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    
                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                                    currentPage === page
                                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                                    : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-xl border border-gray-100 bg-white text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    );
}
