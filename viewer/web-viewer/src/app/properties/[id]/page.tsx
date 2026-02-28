"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/api/axios';
import { ChevronLeft, MapPin, BedDouble, Bath, Home, Share2, Heart, X, Square } from 'lucide-react';
import { useAuth } from '@/context/useAuth';

function formatPrice(price: number): string {
    if (price >= 1000000) {
        const millions = price / 1000000;
        return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)} triệu`;
    }
    return price.toLocaleString('vi-VN');
}

export default function PropertyDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
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
                setImages(rawImgs.length > 0 ? rawImgs : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200']);

                if (user) {
                    const favs = await api.get('/users/favorites');
                    setIsFavorite(favs.data.some((f: any) => f.house_id === propertyId));
                }
            } catch (err) {
                console.error("Failed to fetch details", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [propertyId, user]);

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
                <span className="text-gray-500 font-medium">Đang tải...</span>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-white">
                <span className="text-gray-500 font-medium mb-4">Không tìm thấy thông tin nhà.</span>
                <button
                    onClick={() => router.back()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold"
                >
                    Quay lại
                </button>
            </div>
        );
    }

    const isAvailable = property.status?.toLowerCase() === 'available';
    const statusColor = isAvailable ? 'bg-emerald-500' : 'bg-red-500';
    const statusLabel = isAvailable ? 'Đang cho thuê' : 'Đã thuê';

    // Compute robust localized address
    const address = property.address || `${property.district ? property.district + ', ' : ''}${property.city}`;

    return (
        <div className="flex flex-col min-h-screen bg-white pb-[140px]">
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
                    <span className="text-[26px] font-[800]">{formatPrice(property.price)} VNĐ</span>
                    <span className="text-sm font-medium text-gray-500 ml-1">/tháng</span>
                </div>

                {/* Title */}
                <h1 className="text-[22px] font-bold text-gray-900 leading-8 mb-3">{property.name || property.title}</h1>

                {/* Address Row */}
                <div className="flex items-start gap-1.5 mb-6 text-gray-500">
                    <MapPin size={16} className="mt-1 flex-shrink-0" />
                    <span className="text-[15px] leading-relaxed flex-1">{address}</span>
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
                        <span className="text-[13px] text-gray-500">Phòng ngủ</span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <div className="w-[50px] h-[50px] rounded-full bg-[#EEF2F7] flex justify-center items-center">
                            <Bath size={20} className="text-blue-600" />
                        </div>
                        <span className="text-[15px] font-bold text-gray-900">{property.is_private_bathroom || property.hasPrivateBathroom ? 'Khép kín' : 'Chung'}</span>
                        <span className="text-[13px] text-gray-500">Phòng tắm</span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <div className="w-[50px] h-[50px] rounded-full bg-[#EEF2F7] flex justify-center items-center">
                            <Square size={20} className="text-blue-600" />
                        </div>
                        <span className="text-[15px] font-bold text-gray-900">{property.area || 0} m²</span>
                        <span className="text-[13px] text-gray-500">Diện tích</span>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-200 w-full mb-6"></div>

                {/* Description */}
                <div className="mb-20">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Mô tả chi tiết</h2>
                    <p className="text-[15px] leading-[24px] text-gray-600 whitespace-pre-wrap">
                        {property.description || "Chưa có mô tả chi tiết."}
                    </p>
                </div>
            </div>

            {/* Static Bottom Contact Action Bar */}
            <div className="fixed bottom-[60px] left-0 right-0 bg-white px-5 pt-3 pb-3 border-t border-gray-200 shadow-[0_-3px_5px_rgba(0,0,0,0.05)] z-40 w-full">
                <button className="w-full bg-blue-600 text-white py-3.5 rounded-xl text-base font-bold flex justify-center items-center hover:bg-blue-700 active:scale-[0.98] transition-all">
                    Liên hệ ngay
                </button>
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
