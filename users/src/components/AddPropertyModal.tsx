"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Loader2, Upload, Image as ImageIcon, Video, Trash2, CheckCircle, XCircle, MapPin, Navigation } from 'lucide-react';
import { useAuth } from '@/context/useAuth';
import api from '@/api/axios';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });

// We define a wrapper for useMap that only gets called inside MapContainer
const MapViewUpdater = ({ center }: { center: [number, number] }) => {
    // Import useMap inside the component to avoid SSR issues
    const { useMap: useMapHook } = require('react-leaflet');
    const map = useMapHook();
    
    useEffect(() => {
        if (center) {
            map.setView(center, 16);
        }
    }, [center, map]);
    
    return null;
};

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLanguage } from '@/context/LanguageContext';

const markerSvg = encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
        '<circle cx="12" cy="12" r="9" fill="#3b82f6" stroke="white" stroke-width="3"/>' +
    '</svg>'
);
const customIcon = L.icon({
    iconUrl: `data:image/svg+xml,${markerSvg}`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

interface AddPropertyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const API_BASE = () => {
    const env = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    if (env) return env.replace(/\/+$/, '');
    if (typeof window !== 'undefined') return `${window.location.protocol}//${window.location.hostname}:3000`;
    return 'http://localhost:3000';
};

function removeVietnameseTones(str: string) {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D");
}

async function uploadFile(file: File, type: 'image' | 'video'): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE()}/upload/${type}`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`${type} upload failed`);
    const data = await res.json();
    return data.url as string;
}

export default function AddPropertyModal({ isOpen, onClose, onSuccess }: AddPropertyModalProps) {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    
    const [images, setImages] = useState<string[]>([]);   // up to 7 Cloudinary URLs
    const [videos, setVideos] = useState<string[]>([]);   // up to 2 Cloudinary URLs
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const markerRef = useRef<any>(null);

    const [formData, setFormData] = useState({
        name: '',
        property_type: 'house',
        street_address: '',
        ward: '',
        district: '',
        city: '',
        price: '',
        square: '',
        bedrooms: '',
        description: '',
        contact_phone: '',
        latitude: 21.0285, // Default Hanoi
        longitude: 105.8542
    });

    const [mapCenter, setMapCenter] = useState<[number, number]>([21.0285, 105.8542]);

    // Handle geocoding with debounce
    useEffect(() => {
        if (!isOpen) return;
        
        const { street_address, ward, district, city } = formData;
        if (!street_address && !ward && !district && !city) return;

        const timer = setTimeout(async () => {
            setIsGeocoding(true);
            try {
                const fullAddress = `${street_address}, ${ward}, ${district}, ${city}, Vietnam`;
                const cleanAddress = removeVietnameseTones(fullAddress);
                const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanAddress)}&format=json&limit=1`;
                
                const response = await fetch(url, {
                    headers: { 'User-Agent': 'RentalApp/1.0' }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        const lat = parseFloat(data[0].lat);
                        const lon = parseFloat(data[0].lon);
                        setFormData(prev => ({ ...prev, latitude: lat, longitude: lon }));
                        setMapCenter([lat, lon]);
                    }
                }
            } catch (error) {
                console.error('Geocoding error:', error);
            } finally {
                setIsGeocoding(false);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [formData.street_address, formData.ward, formData.district, formData.city, isOpen]);

    const handleUseCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setFormData(prev => ({ ...prev, latitude, longitude }));
                setMapCenter([latitude, longitude]);
            },
            (error) => {
                console.error("Error getting location:", error);
                alert("Unable to retrieve your location");
            }
        );
    }, []);

    const handleDragEnd = () => {
        const marker = markerRef.current;
        if (marker != null) {
            const position = marker.getLatLng();
            setFormData(prev => ({ ...prev, latitude: position.lat, longitude: position.lng }));
        }
    };

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        let value = e.target.value;
        if (e.target.name === 'price') {
            const rawValue = value.replace(/\D/g, '');
            value = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        }
        setFormData(prev => ({ ...prev, [e.target.name]: value }));
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const remaining = 7 - images.length;
        const toUpload = files.slice(0, remaining);
        setUploadingMedia(true);
        try {
            const urls = await Promise.all(toUpload.map(f => uploadFile(f, 'image')));
            const previews = toUpload.map(f => URL.createObjectURL(f));
            setImages(prev => [...prev, ...urls]);
            setImagePreviews(prev => [...prev, ...previews]);
        } catch (err) {
            console.error('Image upload error', err);
            alert('Failed to upload one or more images.');
        } finally {
            setUploadingMedia(false);
            if (imageInputRef.current) imageInputRef.current.value = '';
        }
    };

    const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const remaining = 2 - videos.length;
        const toUpload = files.slice(0, remaining);
        setUploadingMedia(true);
        try {
            const urls = await Promise.all(toUpload.map(f => uploadFile(f, 'video')));
            setVideos(prev => [...prev, ...urls]);
        } catch (err) {
            console.error('Video upload error', err);
            alert('Failed to upload one or more videos.');
        } finally {
            setUploadingMedia(false);
            if (videoInputRef.current) videoInputRef.current.value = '';
        }
    };

    const removeImage = (idx: number) => {
        setImages(prev => prev.filter((_, i) => i !== idx));
        setImagePreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const removeVideo = (idx: number) => {
        setVideos(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) { alert(t('login_to_add')); return; }
        setSubmitState('loading');
        try {
            const fullAddressString = `${formData.street_address}, ${formData.ward}, ${formData.district}, ${formData.city}`.replace(/^, |, $/g, '');
            const payload: Record<string, any> = {
                ...formData,
                address: fullAddressString,
                price: formData.price ? Number(String(formData.price).replace(/\./g, '')) : null,
                square: formData.square ? Number(formData.square) : null,
                bedrooms: formData.bedrooms ? Number(formData.bedrooms) : null,
                name: formData.property_type.charAt(0).toUpperCase() + formData.property_type.slice(1) + ' at ' + formData.street_address,
            };
            images.forEach((url, i) => { payload[`image_url_${i + 1}`] = url; });
            videos.forEach((url, i) => { payload[`video_url_${i + 1}`] = url; });
            
            await api.post('/houses', payload);
            setSubmitState('success');
            setTimeout(() => {
                onSuccess?.();
                onClose();
                setTimeout(() => setSubmitState('idle'), 300);
            }, 2000);
        } catch (err: any) {
            console.error(err);
            setSubmitState('error');
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                    <h2 className="text-xl font-semibold text-gray-800">{t('add_property')}</h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {submitState !== 'idle' ? (
                    <div className="p-10 flex flex-col items-center justify-center space-y-4 min-h-[300px]">
                        {submitState === 'loading' && (
                            <>
                                <Loader2 size={48} className="animate-spin text-blue-600" />
                                <p className="text-lg font-medium text-gray-700">{t('submitting_property')}</p>
                            </>
                        )}
                        {submitState === 'success' && (
                            <>
                                <CheckCircle size={60} className="text-green-500" />
                                <p className="text-lg font-medium text-green-600">{t('submitted_success')}</p>
                            </>
                        )}
                        {submitState === 'error' && (
                            <>
                                <XCircle size={60} className="text-red-500" />
                                <p className="text-lg font-medium text-red-600">{t('submitted_failed')}</p>
                                <button type="button" onClick={() => setSubmitState('idle')} className="mt-4 px-6 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-medium transition-colors">
                                    {t('try_again')}
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Type */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">{t('property_type')} <span className="text-red-500">*</span></label>
                        <select required name="property_type" value={formData.property_type} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="house">{t('house')}</option>
                            <option value="commercial space">{t('commercial_space')}</option>
                            <option value="apartment">{t('apartment')}</option>
                            <option value="condominium">{t('condominium')}</option>
                            <option value="hotel">{t('hotel')}</option>
                        </select>
                    </div>

                    {/* City + District */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">{t('city')} <span className="text-red-500">*</span></label>
                            <input required name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder={t('city')} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">{t('district')} <span className="text-red-500">*</span></label>
                            <input required name="district" value={formData.district} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder={t('district')} />
                        </div>
                    </div>

                    {/* Ward + Street Address */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">{t('ward')} <span className="text-red-500">*</span></label>
                            <input required name="ward" value={formData.ward} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder={t('ward')} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">{t('street_address')} <span className="text-red-500">*</span></label>
                            <input required name="street_address" value={formData.street_address} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="12 ngo 34 Tran Phu" />
                        </div>
                    </div>

                    {/* Map Pin Picker */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-sm font-medium text-gray-700">{t('exact_location')} <span className="text-red-500">*</span></label>
                            <button 
                                type="button" 
                                onClick={handleUseCurrentLocation}
                                className="flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:text-blue-700 transition-colors"
                            >
                                <Navigation size={12} />
                                {t('use_current_location')}
                            </button>
                        </div>
                        <div className="relative">
                            <div className="h-[200px] w-full rounded-xl overflow-hidden border border-gray-200 z-10">
                                {typeof window !== 'undefined' && (
                                    <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                        <Marker 
                                            draggable={true}
                                            eventHandlers={{ dragend: handleDragEnd }}
                                            position={[formData.latitude, formData.longitude]}
                                            ref={markerRef}
                                            icon={customIcon}
                                        />
                                        <MapViewUpdater center={mapCenter} />
                                    </MapContainer>
                                )}
                            </div>
                            {isGeocoding && (
                                <div className="absolute inset-0 z-[1001] bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                                    <div className="bg-white/90 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2 border border-blue-50/50">
                                        <Loader2 size={14} className="animate-spin text-blue-600" />
                                        <span className="text-[11px] font-medium text-blue-700 uppercase tracking-tight">{t('geocoding_loading')}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                            <MapPin size={10} className="text-gray-300" />
                            {t('drag_pin')}
                        </p>
                    </div>

                    {/* Price + Area */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">{t('price_vnd')}</label>
                            <input type="text" name="price" value={formData.price} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">{t('area_m2')}</label>
                            <input type="number" name="square" value={formData.square} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.0" />
                        </div>
                    </div>

                    {/* Bedrooms + Phone */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">{t('bedrooms')}</label>
                            <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">{t('contact_phone')}</label>
                            <input name="contact_phone" value={formData.contact_phone} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="+84..." />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">{t('description')}</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="..." />
                    </div>

                    {/* Images */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><ImageIcon size={15} /> {t('photos')} <span className="text-gray-400 font-normal">({images.length}/7)</span></label>
                            {images.length < 7 && (
                                <button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploadingMedia} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 disabled:opacity-50">
                                    <Upload size={13} /> {t('upload')}
                                </button>
                            )}
                        </div>
                        <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-4 gap-2">
                                {imagePreviews.map((src, i) => (
                                    <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                                        <img src={src} alt="" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removeImage(i)} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Trash2 size={16} className="text-white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {images.length === 0 && (
                            <button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploadingMedia} className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors disabled:opacity-50">
                                <ImageIcon size={22} />
                                <span className="text-xs">{t('click_add_photos')}</span>
                            </button>
                        )}
                    </div>

                    {/* Videos */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><Video size={15} /> {t('videos')} <span className="text-gray-400 font-normal">({videos.length}/2)</span></label>
                            {videos.length < 2 && (
                                <button type="button" onClick={() => videoInputRef.current?.click()} disabled={uploadingMedia} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 disabled:opacity-50">
                                    <Upload size={13} /> {t('upload')}
                                </button>
                            )}
                        </div>
                        <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={handleVideoSelect} />
                        {videos.length > 0 && (
                            <div className="flex flex-col gap-2">
                                {videos.map((url, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                        <Video size={16} className="text-blue-500 shrink-0" />
                                        <span className="text-xs text-gray-600 truncate flex-1">Video {i + 1} uploaded ✓</span>
                                        <button type="button" onClick={() => removeVideo(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {videos.length === 0 && (
                            <button type="button" onClick={() => videoInputRef.current?.click()} disabled={uploadingMedia} className="w-full h-16 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-2 text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors disabled:opacity-50">
                                <Video size={18} />
                                <span className="text-xs">{t('click_add_videos')}</span>
                            </button>
                        )}
                    </div>

                    {uploadingMedia && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                            <Loader2 size={16} className="animate-spin" /> {t('uploading_cloud')}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 px-4 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors">
                            {t('cancel')}
                        </button>
                        <button type="submit" disabled={uploadingMedia} className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                            {t('submit_property')}
                        </button>
                    </div>
                </form>
                )}
            </div>
        </div>
    );
}
