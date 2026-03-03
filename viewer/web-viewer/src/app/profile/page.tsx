"use client";

import { useEffect, useState, useRef } from 'react';
import api from '@/api/axios';
import PropertyCard from '@/components/PropertyCard';
import { useAuth } from '@/context/useAuth';
import { Heart, MessageCircle, User as UserIcon, Camera, MapPin, ChevronRight, Clock } from 'lucide-react';
import Link from 'next/link';

const resolveUploadImageUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (envUrl) return `${envUrl.replace(/\/+$/, '')}/upload/image`;

    if (typeof window !== 'undefined' && window.location?.hostname) {
        return `${window.location.protocol}//${window.location.hostname}:3000/upload/image`;
    }

    return 'http://localhost:3000/upload/image';
};

export default function ProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loadingFavs, setLoadingFavs] = useState(true);
    const [activeTab, setActiveTab] = useState<'favorites' | 'messages'>('favorites');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch favorites
    const fetchFavorites = async () => {
        try {
            const res = await api.get('/users/favorites');
            const formatted = res.data.map((fav: any) => {
                const h = fav.house;
                return {
                    id: h.id,
                    title: h.name,
                    address: `${h.district ? h.district + ', ' : ''}${h.city}`,
                    city: h.city,
                    latitude: h.latitude,
                    longitude: h.longitude,
                    price: h.price,
                    bedrooms: h.bedrooms,
                    bathrooms: h.bathrooms || 1,
                    hasPrivateBathroom: h.is_private_bathroom,
                    area: h.square,
                    description: h.description,
                    status: h.status || 'AVAILABLE',
                    image_url: h.image_url_1 || h.image_url_2 || h.image_url_3 || '/images/defaultimage.jpg'
                };
            });
            setFavorites(formatted);
        } catch (err) {
            console.error('Failed to fetch favorites', err);
        } finally {
            setLoadingFavs(false);
        }
    };

    useEffect(() => {
        if (!authLoading && user) {
            fetchFavorites();
            // Simulate loading avatar logic if existed over API, falling back to local storage for demo
            const savedAvatar = localStorage.getItem(`avatar_${user.id}`);
            if (savedAvatar) setAvatarUrl(savedAvatar);
        }
    }, [user, authLoading]);

    const handleRemoveFavorite = async (propertyId: string) => {
        try {
            await api.post('/users/favorites/toggle', { houseId: propertyId });
            setFavorites(prev => prev.filter(p => p.id !== propertyId));
        } catch (error) {
            console.error('Failed to remove favorite', error);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch(resolveUploadImageUrl(), {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) throw new Error("Upload failed");
                const data = await response.json();

                if (data.url) {
                    setAvatarUrl(data.url);
                    if (user) localStorage.setItem(`avatar_${user.id}`, data.url);
                }
            } catch (err) {
                console.error("Avatar upload error", err);
            } finally {
                setIsUploading(false);
            }
        }
    };

    if (authLoading) {
        return <div className="p-12 text-center animate-pulse">Đang tải...</div>;
    }

    if (!user) {
        return (
            <div className="max-w-md mx-auto px-4 py-20 text-center">
                <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                    <UserIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Chưa đăng nhập</h2>
                <p className="text-gray-500 mb-8">Vui lòng đăng nhập để xem hồ sơ, nhà yêu thích và tin nhắn của bạn.</p>
                <Link href="/login" className="inline-flex w-full items-center justify-center px-6 py-3.5 border border-transparent text-base font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition">
                    Đăng nhập / Đăng ký
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full bg-white min-h-[calc(100vh-60px)] pb-28">
            {/* Header / Profile Info */}
            <div className="bg-white px-4 pt-8 pb-6 border-b border-gray-200">
                <div className="max-w-3xl mx-auto flex items-center gap-5">
                    <div className="relative cursor-pointer group" onClick={handleAvatarClick}>
                        <div className="w-20 h-20 rounded-full border-4 border-gray-50 shadow-sm overflow-hidden bg-gray-100 flex items-center justify-center relative">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className={`w-full h-full object-cover ${isUploading ? 'opacity-50' : ''}`} />
                            ) : (
                                <UserIcon className={`w-8 h-8 text-gray-400 ${isUploading ? 'opacity-50' : ''}`} />
                            )}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                {isUploading ? (
                                    <span className="text-white text-xs font-bold">Uploading...</span>
                                ) : (
                                    <Camera className="text-white w-6 h-6" />
                                )}
                            </div>
                        </div>
                        {/* Hidden File Input */}
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{user.name || 'Người Dùng'}</h1>
                        <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
                    </div>
                </div>
            </div>

            {/* Sticky Tabs */}
            <div className="sticky top-0 bg-white border-b border-gray-200 z-10 px-4">
                <div className="max-w-3xl mx-auto flex">
                    <button
                        onClick={() => setActiveTab('favorites')}
                        className={`flex-1 py-3.5 text-sm font-semibold border-b-2 transition ${activeTab === 'favorites' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                    >
                        Tin Lưu ({favorites.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`flex-1 py-3.5 text-sm font-semibold border-b-2 transition ${activeTab === 'messages' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                    >
                        Tin nhắn
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-3xl mx-auto px-4 py-6">

                {/* Favorites Tab */}
                {activeTab === 'favorites' && (
                    <div className="space-y-4">
                        {loadingFavs ? (
                            <div className="animate-pulse space-y-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-[120px] bg-gray-200 rounded-xl w-full" />)}
                            </div>
                        ) : favorites.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 mx-2">
                                <Heart className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có tin lưu</h3>
                                <p className="text-gray-500 text-sm">Bấm vào biểu tượng trái tim để lưu lại.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {favorites.map((property: any) => (
                                    <PropertyCard
                                        key={property.id}
                                        property={property}
                                        isFavorite={true}
                                        onToggleFavorite={handleRemoveFavorite}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Messages Tab */}
                {activeTab === 'messages' && (
                    <div className="space-y-3">
                        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 mx-2">
                            <MessageCircle className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có tin nhắn</h3>
                            <p className="text-gray-500 text-sm">Trao đổi với Quản trị viên hoặc Chủ nhà sẽ xuất hiện ở đây.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
