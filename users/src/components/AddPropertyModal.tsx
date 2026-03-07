"use client";

import React, { useState, useRef } from 'react';
import { X, Loader2, Upload, Image as ImageIcon, Video, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/useAuth';
import api from '@/api/axios';

interface AddPropertyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const API_BASE = () => {
    const env = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (env) return env.replace(/\/+$/, '');
    if (typeof window !== 'undefined') return `${window.location.protocol}//${window.location.hostname}:3000`;
    return 'http://localhost:3000';
};

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
    const [loading, setLoading] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const [images, setImages] = useState<string[]>([]);   // up to 7 Cloudinary URLs
    const [videos, setVideos] = useState<string[]>([]);   // up to 2 Cloudinary URLs
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: '',
        property_type: 'house',
        address: '',
        district: '',
        city: '',
        price: '',
        square: '',
        bedrooms: '',
        description: '',
        contact_phone: ''
    });

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
        if (!user) { alert('Please log in to add a property'); return; }
        setLoading(true);
        try {
            const payload: Record<string, any> = {
                ...formData,
                price: formData.price ? Number(formData.price) : null,
                square: formData.square ? Number(formData.square) : null,
                bedrooms: formData.bedrooms ? Number(formData.bedrooms) : null,
            };
            images.forEach((url, i) => { payload[`image_url_${i + 1}`] = url; });
            videos.forEach((url, i) => { payload[`video_url_${i + 1}`] = url; });
            await api.post('/houses', payload);
            alert('Property added successfully!');
            onSuccess?.();
            onClose();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to add property');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                    <h2 className="text-xl font-semibold text-gray-800">Add Property</h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Name */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Property Name <span className="text-red-500">*</span></label>
                        <input required name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="E.g. Sunny Apartment" />
                    </div>

                    {/* Type */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Property Type <span className="text-red-500">*</span></label>
                        <select required name="property_type" value={formData.property_type} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="house">House</option>
                            <option value="commercial space">Commercial Space</option>
                            <option value="apartment">Apartment</option>
                            <option value="condominium">Condominium</option>
                            <option value="hotel">Hotel</option>
                        </select>
                    </div>

                    {/* City + District */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">City <span className="text-red-500">*</span></label>
                            <input required name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="City" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">District <span className="text-red-500">*</span></label>
                            <input required name="district" value={formData.district} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="District" />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Address <span className="text-red-500">*</span></label>
                        <input required name="address" value={formData.address} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Full street address" />
                    </div>

                    {/* Price + Area */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Price (VND)</label>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Area (m²)</label>
                            <input type="number" name="square" value={formData.square} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.0" />
                        </div>
                    </div>

                    {/* Bedrooms + Phone */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Bedrooms</label>
                            <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Contact Phone</label>
                            <input name="contact_phone" value={formData.contact_phone} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="+84..." />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Property details..." />
                    </div>

                    {/* Images */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><ImageIcon size={15} /> Photos <span className="text-gray-400 font-normal">({images.length}/7)</span></label>
                            {images.length < 7 && (
                                <button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploadingMedia} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 disabled:opacity-50">
                                    <Upload size={13} /> Upload
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
                                <span className="text-xs">Click to add photos (max 7)</span>
                            </button>
                        )}
                    </div>

                    {/* Videos */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><Video size={15} /> Videos <span className="text-gray-400 font-normal">({videos.length}/2)</span></label>
                            {videos.length < 2 && (
                                <button type="button" onClick={() => videoInputRef.current?.click()} disabled={uploadingMedia} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 disabled:opacity-50">
                                    <Upload size={13} /> Upload
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
                                <span className="text-xs">Click to add videos (max 2)</span>
                            </button>
                        )}
                    </div>

                    {uploadingMedia && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                            <Loader2 size={16} className="animate-spin" /> Uploading media to Cloudinary...
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 px-4 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading || uploadingMedia} className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                            {loading && <Loader2 size={18} className="animate-spin" />}
                            Submit Property
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
