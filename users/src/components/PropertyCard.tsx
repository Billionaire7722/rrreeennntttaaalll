import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { MapPin, Bed, Bath, Square, Heart, Pencil, Trash2, Home, DollarSign } from 'lucide-react';
import React from 'react';

export interface Property {
    id: string;
    title: string;
    property_type?: string;
    description?: string;
    price: number;
    address: string;
    city: string;
    bedrooms: number;
    bathrooms?: number;
    hasPrivateBathroom?: boolean;
    area: number;
    image_url: string;
    status: string;
    latitude?: number;
    longitude?: number;
}

interface PropertyCardProps {
    property: Property;
    variant?: 'grid' | 'list' | 'compact';
    isFavorite?: boolean;
    onToggleFavorite?: (id: string) => void;
    onEdit?: (property: Property) => void;
    onDelete?: (id: string) => void;
}

export default function PropertyCard({ 
    property, 
    variant = 'grid', 
    isFavorite, 
    onToggleFavorite,
    onEdit,
    onDelete
}: PropertyCardProps) {
    const defaultImage = '/images/defaultimage.jpg';
    const { t } = useLanguage();

    const statusBadge = (
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md shadow-sm uppercase tracking-wider ${
            property.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
        }`}>
            {property.status === 'AVAILABLE' ? t('available') : t('rented')}
        </span>
    );

    const actionButtons = (
        <div className="flex gap-1.5">
            {onEdit && (
                <button
                    onClick={(e) => { e.preventDefault(); onEdit(property); }}
                    className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Edit"
                >
                    <Pencil size={14} />
                </button>
            )}
            {onDelete && (
                <button
                    onClick={(e) => { e.preventDefault(); onDelete(property.id); }}
                    className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-colors"
                    title="Delete"
                >
                    <Trash2 size={14} />
                </button>
            )}
            {onToggleFavorite && (
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        onToggleFavorite(property.id);
                    }}
                    className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm flex items-center justify-center transition-colors"
                >
                    <Heart className={`h-4 w-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`} />
                </button>
            )}
        </div>
    );

    if (variant === 'compact') {
        return (
            <div className="bg-white rounded-xl border border-gray-100 hover:border-teal-100 hover:shadow-md transition-all duration-200 group overflow-hidden">
                <Link href={`/properties/${property.id}`} className="flex items-center p-3 gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        <img
                            src={property.image_url || defaultImage}
                            alt={property.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                            <h4 className="font-bold text-gray-900 truncate text-sm capitalize">
                                {property.property_type || property.title}
                            </h4>
                            <span className="text-teal-600 font-bold text-sm whitespace-nowrap">
                                {property.price ? (property.price / 1_000_000).toFixed(1) + 'M' : '0M'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                <Bed size={10} /> {property.bedrooms} BR
                            </span>
                            <span className="text-[10px] text-gray-400">•</span>
                            <span className="text-[10px] text-gray-400">{property.area} m²</span>
                        </div>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5 flex items-center gap-1">
                            <MapPin size={10} /> {property.address}, {property.city}
                        </p>
                    </div>
                    <div className="flex-shrink-0 ml-1">
                        {actionButtons}
                    </div>
                </Link>
            </div>
        );
    }

    if (variant === 'list') {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 hover:border-teal-100 hover:shadow-lg transition-all duration-300 group overflow-hidden">
                <Link href={`/properties/${property.id}`} className="flex flex-col sm:flex-row h-full">
                    <div className="relative w-full sm:w-48 md:w-56 h-48 sm:h-auto flex-shrink-0 overflow-hidden bg-gray-100">
                        <img
                            src={property.image_url || defaultImage}
                            alt={property.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3">
                            {statusBadge}
                        </div>
                    </div>
                    <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                        <div>
                            <div className="flex justify-between items-start gap-4">
                                <h3 className="text-lg font-bold text-gray-900 truncate capitalize">
                                    {property.property_type || property.title}
                                </h3>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-xl font-black text-teal-600">
                                        {property.price ? property.price.toLocaleString('vi-VN') : 0} <span className="text-xs font-normal">VND{t('month_abbr')}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center text-gray-400 text-sm mt-1 mb-4">
                                <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                                <span className="truncate">{property.address}, {property.city}</span>
                            </div>
                            
                            <div className="flex items-center gap-4 flex-wrap">
                                <span className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                                    <Bed className="h-4 w-4 text-teal-500" />
                                    {property.bedrooms} {t('bedrooms')}
                                </span>
                                <span className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                                    <Bath className="h-4 w-4 text-teal-500" />
                                    {property.hasPrivateBathroom ? t('private_bath') : t('shared_bath')}
                                </span>
                                <span className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                                    <Square className="h-4 w-4 text-teal-500" />
                                    {property.area} m²
                                </span>
                            </div>
                        </div>
                        <div className="mt-4 sm:mt-0 flex justify-end">
                            {actionButtons}
                        </div>
                    </div>
                </Link>
            </div>
        );
    }

    // Default: Grid View
    return (
        <div className="bg-white rounded-[2rem] border border-gray-100 hover:border-teal-100 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden flex flex-col h-full">
            <Link href={`/properties/${property.id}`} className="relative h-56 w-full overflow-hidden block flex-shrink-0">
                <img
                    src={property.image_url || defaultImage}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-4 left-4">
                    {statusBadge}
                </div>
                <div className="absolute top-4 right-4">
                    {actionButtons}
                </div>
            </Link>

            <div className="p-6 flex flex-col flex-1">
                <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 truncate capitalize mb-1">
                        {property.property_type || property.title}
                    </h3>
                    <div className="flex items-center text-gray-400 text-sm">
                        <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                        <span className="truncate">{property.address}, {property.city}</span>
                    </div>
                </div>

                <div className="mt-auto">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('price') || 'Price'}</span>
                            <p className="text-xl font-black text-teal-600 leading-tight">
                                {property.price ? property.price.toLocaleString('vi-VN') : 0}
                                <span className="text-xs font-medium ml-1">VND{t('month_abbr')}</span>
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center p-2 rounded-2xl bg-gray-50/50 group-hover:bg-teal-50 transition-colors">
                            <Bed className="h-4 w-4 text-teal-500 mb-1" />
                            <span className="text-xs font-bold text-gray-700">{property.bedrooms}</span>
                            <span className="text-[9px] text-gray-400 uppercase font-semibold">BR</span>
                        </div>
                        <div className="flex flex-col items-center p-2 rounded-2xl bg-gray-50/50 group-hover:bg-teal-50 transition-colors">
                            <Bath className="h-4 w-4 text-teal-500 mb-1" />
                            <span className="text-xs font-bold text-gray-700">{property.hasPrivateBathroom ? 'Yes' : 'No'}</span>
                            <span className="text-[9px] text-gray-400 uppercase font-semibold">Priv</span>
                        </div>
                        <div className="flex flex-col items-center p-2 rounded-2xl bg-gray-50/50 group-hover:bg-teal-50 transition-colors">
                            <Square className="h-4 w-4 text-teal-500 mb-1" />
                            <span className="text-xs font-bold text-gray-700">{property.area}</span>
                            <span className="text-[9px] text-gray-400 uppercase font-semibold">sqm</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
