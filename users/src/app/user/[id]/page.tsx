"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/api/axios';
import { ChevronLeft, MapPin, BedDouble, Bath, Square, MessageCircle, Heart } from 'lucide-react';
import { useAuth } from '@/context/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import SafeImage from '@/components/SafeImage';

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

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const { t } = useLanguage();
    const targetUserId = params.id as string;

    const [userProfile, setUserProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const res = await api.get(`/users/public/${targetUserId}`);
                setUserProfile(res.data);
            } catch (err) {
                console.error("Failed to fetch user profile", err);
            } finally {
                setLoading(false);
            }
        };

        if (targetUserId) {
            fetchUserProfile();
        }
    }, [targetUserId]);

    const handleMessageUser = () => {
        if (!currentUser) {
            router.push('/login');
            return;
        }
        
        // Prevent messaging self
        if (currentUser.id === targetUserId) {
            alert("You cannot message yourself.");
            return;
        }

        const queryParams = new URLSearchParams();
        queryParams.set('adminId', targetUserId);
        router.push(`/chat?${queryParams.toString()}`);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <span className="text-gray-500 font-medium">Loading profile...</span>
            </div>
        );
    }

    if (!userProfile) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-gray-50 px-4">
                <span className="text-gray-500 font-medium mb-4 text-center">User not found or has been removed.</span>
                <button
                    onClick={() => router.back()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const { name, avatarUrl, coverUrl, bio, ownedHouses } = userProfile;
    const hasHouses = ownedHouses && ownedHouses.length > 0;

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header / Nav */}
            <div className="sticky top-0 bg-white shadow-sm z-20 px-4 py-3 flex items-center gap-3">
                <button 
                    onClick={() => router.back()} 
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <ChevronLeft size={24} className="text-gray-800" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">User Profile</h1>
            </div>

            {/* Cover Image Hero */}
            <div className="relative w-full h-44 overflow-hidden bg-gray-100">
                <SafeImage
                    src={coverUrl || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80"}
                    alt="Cover"
                    className="w-full h-full object-cover"
                    fallbackSrc="/images/defaultimage.jpg"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/50" />
            </div>

            {/* Profile Info Card */}
            <div className="bg-white border-b border-gray-100 px-5 pb-8 flex flex-col items-center shadow-sm relative">
                {/* Avatar overlapping cover */}
                <div className="-mt-12 mb-3 relative z-10">
                    {avatarUrl ? (
                         <SafeImage src={avatarUrl} alt={name} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" fallbackSrc="/images/defaultimage.jpg" />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-3xl font-bold border-4 border-white shadow-md">
                            {getInitials(name)}
                        </div>
                    )}
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{name}</h2>
                
                {bio && (
                    <p className="text-sm text-gray-600 mt-2 text-center max-w-[300px] leading-relaxed">
                        {bio}
                    </p>
                )}

                <button 
                    onClick={handleMessageUser}
                    className="mt-6 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-full font-semibold transition-all shadow-sm active:scale-95"
                >
                    <MessageCircle size={18} />
                    Message User
                </button>
            </div>

            {/* User's Properties Title */}
            <div className="px-5 pt-8 pb-3">
                <h3 className="text-lg font-bold text-gray-900">
                    Properties by {name.split(' ')[0]} 
                    <span className="text-gray-500 font-normal ml-2 text-sm">({ownedHouses?.length || 0})</span>
                </h3>
            </div>

            {/* Properties List */}
            <div className="px-4 space-y-4">
                {hasHouses ? (
                    ownedHouses.map((house: any) => {
                        const isAvailable = house.status?.toLowerCase() === 'available';
                        const address = house.address || `${house.district ? house.district + ', ' : ''}${house.city}`;

                        return (
                            <div key={house.id} onClick={() => router.push(`/properties/${house.id}`)} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                                {/* Auto-sized Image Thumbnail (16:9 approx) */}
                                <div className="h-48 w-full relative bg-gray-100">
                                    <SafeImage 
                                        src={house.image_url_1 || '/images/defaultimage.jpg'} 
                                        alt={house.name} 
                                        className="w-full h-full object-cover" 
                                        fallbackSrc="/images/defaultimage.jpg"
                                    />
                                    {/* Status Badge */}
                                    <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-bold text-white shadow-sm ${isAvailable ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                        {isAvailable ? t("available") : t("rented")}
                                    </div>
                                </div>
                                
                                {/* Card Body */}
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="text-[17px] font-bold text-gray-900 line-clamp-1 flex-1 pr-2 capitalize">{house.property_type || house.name}</h4>
                                        <span className="text-blue-600 font-bold whitespace-nowrap">
                                            {formatPrice(house.price, t as any)}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5 mb-3 text-gray-500">
                                        <MapPin size={14} className="flex-shrink-0" />
                                        <span className="text-sm line-clamp-1">{address}</span>
                                    </div>

                                    {/* Mini Amenities Row */}
                                    <div className="flex items-center gap-4 text-gray-600 border-t border-gray-100 pt-3">
                                        <div className="flex items-center gap-1.5">
                                            <BedDouble size={16} className="text-gray-400" />
                                            <span className="text-[13px] font-medium">{house.bedrooms}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Bath size={16} className="text-gray-400" />
                                            <span className="text-[13px] font-medium">{house.is_private_bathroom ? 1 : (house.bathrooms || 1)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Square size={16} className="text-gray-400" />
                                            <span className="text-[13px] font-medium">{house.square || 0}m²</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center justify-center text-center shadow-sm">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                            <Heart size={24} className="text-blue-300" />
                        </div>
                        <h4 className="text-gray-900 font-bold mb-1">No properties yet</h4>
                        <p className="text-sm text-gray-500">This user hasn't posted any properties for rent.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
