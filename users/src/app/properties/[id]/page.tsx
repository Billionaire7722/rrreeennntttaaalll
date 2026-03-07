"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/api/axios';
import { ChevronLeft, MapPin, BedDouble, Bath, Share2, Heart, X, Square } from 'lucide-react';
import { useAuth } from '@/context/useAuth';
import { useLanguage } from '@/context/LanguageContext';


function formatPrice(price: number, t: (key: string) => string): string {
    if (price >= 1000000) {
        const millions = price / 1000000;
        return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)} ${t('million')}`;
    }
    return price.toLocaleString('vi-VN');
}

function getInitials(name: string): string {
    return (name || '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('');
}

export default function PropertyDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { t } = useLanguage();
    const propertyId = params.id as string;

    const [property, setProperty] = useState<any>(null);
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);

    // Carousel State
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);

    // Lightbox State
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [fullScreenIndex, setFullScreenIndex] = useState(0);
    const fullscreenCarouselRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) {
            router.replace('/login');
            return;
        }

        const fetchDetails = async () => {
            try {
                const res = await api.get(`/houses/${propertyId}`);
                const data = res.data;
                setProperty(data);

                // Safely extract multiple images whether it came from backend format
                const rawImgs = ([
                    data.image_url_1,
                    data.image_url_2,
                    data.image_url_3,
                    data.image_url
                ]).filter(Boolean) as string[];
                setImages(rawImgs.length > 0 ? rawImgs : ['/images/defaultimage.jpg']);

                if (user) {
                    const favs = await api.get('/users/favorites');
                    setIsFavorite(favs.data.some((f: any) => f.houseId == propertyId));
                }
            } catch (err) {
                console.error("Failed to fetch details", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [propertyId, user, router]);

    const handleToggleFavorite = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        try {
            setIsFavorite(!isFavorite);
            await api.post('/users/favorites/toggle', { houseId: propertyId });
        } catch (error) {
            setIsFavorite(isFavorite);
            console.error('Failed to toggle favorite', error);
        }
    };

    // Handle Scroll for standard Carousel
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (!carouselRef.current) return;
        const index = Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth);
        setActiveImageIndex(index);
    };

    // Handle Scroll for Lightbox Carousel  
    const handleFullScreenScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (!fullscreenCarouselRef.current) return;
        const index = Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth);
        setFullScreenIndex(index);
    };

    const openFullScreen = (index: number) => {
        setFullScreenIndex(index);
        setIsFullScreen(true);
        setTimeout(() => {
            if (fullscreenCarouselRef.current) {
                fullscreenCarouselRef.current.scrollTo({ left: index * window.innerWidth, behavior: 'instant' as any });
            }
        }, 50);
    };

    const closeFullScreen = () => {
        setIsFullScreen(false);
        setActiveImageIndex(fullScreenIndex);
        if (carouselRef.current) {
            carouselRef.current.scrollTo({ left: fullScreenIndex * carouselRef.current.clientWidth, behavior: 'instant' as any });
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <span className="text-gray-500 font-medium">{t("loading")}</span>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-white">
                <span className="text-gray-500 font-medium mb-4">{t("no_info")}</span>
                <button
                    onClick={() => router.back()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold"
                >
                    {t("go_back")}
                </button>
            </div>
        );
    }

    const isAvailable = property.status?.toLowerCase() === 'available';
    const statusColor = isAvailable ? 'bg-emerald-500' : 'bg-red-500';
    const statusLabel = isAvailable ? t("available") : t("rented");

    // Compute robust localized address
    const address = property.address || `${property.district ? property.district + ', ' : ''}${property.city}`;
    const postedByAdmins = Array.isArray(property.postedByAdmins) ? property.postedByAdmins : [];
    const primaryAdmin = postedByAdmins[0];
    const handleContactNow = () => {
        const params = new URLSearchParams();
        if (primaryAdmin?.id) params.set('adminId', primaryAdmin.id);
        params.set('houseId', propertyId);
        params.set('houseTitle', property.name || property.title || '');
        router.push(`/chat?${params.toString()}`);
    };

    return (
        <div className="flex flex-col min-h-[calc(100vh-60px)] bg-white pb-[90px]">
            {/* Base Image Container perfectly matching React Native layout */}
            <div className="relative w-full h-[280px]">
                <div
                    ref={carouselRef}
                    onScroll={handleScroll}
                    className="flex w-full h-[280px] overflow-x-auto snap-x snap-mandatory hide-scrollbar"
                >
                    {images.map((img, idx) => (
                        <div key={idx} onClick={() => openFullScreen(idx)} className="w-full h-[280px] flex-shrink-0 snap-center relative cursor-pointer">
                            <img src={img} alt={`Property ${idx}`} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>

                {/* Overlaid Header Actions (Back Button + Social/Heart) */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 pointer-events-none">
                    <button onClick={(e) => { e.stopPropagation(); router.back() }} className="pointer-events-auto shadow-md w-10 h-10 bg-white/90 rounded-full flex justify-center items-center hover:bg-white transition-colors">
                        <ChevronLeft size={24} className="text-gray-800 pr-0.5" />
                    </button>
                    <div className="flex gap-3 pointer-events-auto">
                        <button className="shadow-md w-10 h-10 bg-white/90 rounded-full flex justify-center items-center hover:bg-white transition-colors">
                            <Share2 size={20} className="text-gray-800" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleToggleFavorite(); }} className="shadow-md w-10 h-10 bg-white/90 rounded-full flex justify-center items-center hover:bg-white transition-colors">
                            <Heart size={20} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-800'} />
                        </button>
                    </div>
                </div>

                {/* Overlaid Status Badge */}
                <div className={`absolute bottom-5 left-4 px-3 py-1.5 rounded-lg shadow-sm text-white text-xs font-bold tracking-wide z-10 ${statusColor}`}>
                    {statusLabel}
                </div>

                {/* Overlaid Pagination Dots */}
                {images.length > 1 && (
                    <div className="absolute bottom-5 right-4 flex gap-1.5 bg-black/30 px-2.5 py-1.5 rounded-full z-10">
                        {images.map((_, idx) => (
                            <div key={idx} className={`h-1.5 rounded-full transition-all ${idx === activeImageIndex ? 'w-3.5 bg-white' : 'w-1.5 bg-white/50'}`} />
                        ))}
                    </div>
                )}
            </div>

            {/* Content Body Container */}
            <div className="p-5">
                {/* Price Row */}
                <div className="flex flex-row items-baseline mb-2 text-blue-600">
                    <span className="text-[26px] font-[800]">{formatPrice(property.price, t as any)} </span>
                    <span className="text-sm font-medium text-gray-500 ml-1">/ {t('vnd_per_month').split('/')[1]?.trim() || 'tháng'}</span>
                </div>

                {/* Title */}
                <h1 className="text-[22px] font-bold text-gray-900 leading-8 mb-3">{property.name || property.title}</h1>

                {/* Address Row */}
                <div className="flex items-start gap-1.5 mb-6 text-gray-500">
                    <MapPin size={16} className="mt-1 flex-shrink-0" />
                    <span className="text-[15px] leading-relaxed flex-1">{address}</span>
                </div>

                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">{t('posted_by')}</h3>
                    {postedByAdmins.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {postedByAdmins.map((admin: any) => (
                                <div key={admin.id} className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1.5">
                                    {admin.avatarUrl ? (
                                        <img src={admin.avatarUrl} alt={admin.name} className="w-7 h-7 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">
                                            {getInitials(admin.name)}
                                        </div>
                                    )}
                                    <span className="text-xs font-medium text-gray-700">{admin.name}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">{t('no_poster_info')}</p>
                    )}
                </div>
                {/* Divider */}
                <div className="h-px bg-gray-200 w-full mb-6"></div>

                {/* Features Row - Native Circular Style */}
                <div className="flex flex-row justify-between px-2 mb-6">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-[50px] h-[50px] rounded-full bg-[#EEF2F7] flex justify-center items-center">
                            <BedDouble size={20} className="text-blue-600" />
                        </div>
                        <span className="text-[15px] font-bold text-gray-900">{property.bedrooms}</span>
                        <span className="text-[13px] text-gray-500">{t("bedrooms")}</span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <div className="w-[50px] h-[50px] rounded-full bg-[#EEF2F7] flex justify-center items-center">
                            <Bath size={20} className="text-blue-600" />
                        </div>
                        <span className="text-[15px] font-bold text-gray-900">{property.is_private_bathroom || property.hasPrivateBathroom ? t("private_bath") : (property.bathrooms || 1)}</span>
                        <span className="text-[13px] text-gray-500">{t("bathrooms")}</span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <div className="w-[50px] h-[50px] rounded-full bg-[#EEF2F7] flex justify-center items-center">
                            <Square size={20} className="text-blue-600" />
                        </div>
                        <span className="text-[15px] font-bold text-gray-900">{property.area || 0} m²</span>
                        <span className="text-[13px] text-gray-500">{t("area")}</span>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-200 w-full mb-6"></div>

                {/* Description */}
                <div className="mb-3">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">{t("description")}</h2>
                    <p className="text-[15px] leading-[24px] text-gray-600 whitespace-pre-wrap">
                        {property.description || t("no_description")}
                    </p>
                </div>

                <div className="mt-3 border-t border-gray-200 pt-4">
                    <button
                        onClick={handleContactNow}
                        className="w-full max-w-[220px] mx-auto bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold flex justify-center items-center hover:bg-blue-700 active:scale-[0.98] transition-all"
                    >
                        {t("contact_now")}
                    </button>
                </div>
            </div>

            {/* Full Screen Lightbox Modal Overlay */}
            {isFullScreen && (
                <div className="fixed inset-0 bg-black/95 z-[99999] flex justify-center items-center flex-col">
                    <button onClick={closeFullScreen} className="absolute top-8 right-5 z-50 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                        <X size={24} className="text-white" />
                    </button>

                    <div
                        ref={fullscreenCarouselRef}
                        onScroll={handleFullScreenScroll}
                        className="flex w-full h-[80%] overflow-x-auto snap-x snap-mandatory hide-scrollbar relative"
                    >
                        {images.map((img, idx) => (
                            <div key={idx} onClick={closeFullScreen} className="w-full h-full flex-shrink-0 snap-center flex justify-center items-center p-2 cursor-pointer">
                                <img src={img} alt={`Fullscreen ${idx}`} className="max-w-full max-h-full object-contain" />
                            </div>
                        ))}
                    </div>

                    {images.length > 1 && (
                        <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2 pointer-events-none">
                            {images.map((_, idx) => (
                                <div key={idx} className={`h-1.5 rounded-full transition-all ${idx === fullScreenIndex ? 'w-3.5 bg-white' : 'w-1.5 bg-white/50'}`} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

