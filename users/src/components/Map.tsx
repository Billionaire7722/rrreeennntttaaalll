"use client";

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRouter } from 'next/navigation';
import { Bed, Square, MapPin, Locate } from 'lucide-react';
import { useAuth } from '@/context/useAuth';
import { useLanguage } from '@/context/LanguageContext';

// Dynamic SVG Icons for Available (Green) and Rented (Red)
const getMarkerIcon = (status?: string | null) => {
    const isAvailable = status?.toLowerCase() === 'available';
    const color = isAvailable ? '#10b981' : '#ef4444'; // Tailwind text-green-500 / text-red-500

    const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3" fill="white"/></svg>`;

    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="width: 32px; height: 32px; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3));">${svgIcon}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

const userIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="width: 20px; height: 20px; background-color: #3b82f6; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.4);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

interface Property {
    id: string;
    title: string;
    price: number;
    latitude: number;
    longitude: number;
    image_url?: string;
    image_url_1?: string;
    image_url_2?: string;
    image_url_3?: string;
    images?: string[];
    status: string;
    bedrooms?: number;
    area?: number;
    square?: number;
    address?: string;
    city?: string;
    district?: string;
}

interface MapProps {
    properties: Property[];
    center?: [number, number];
    zoom?: number;
    onBoundsChange?: (bounds: string) => void;
}

// Component to handle map bound changes and emitting events
function MapEvents({ onBoundsChange, setUserLocation }: { onBoundsChange?: (bounds: string) => void, setUserLocation: (c: [number, number]) => void }) {
    const map = useMap();
    const onBoundsChangeRef = useRef(onBoundsChange);

    useEffect(() => {
        onBoundsChangeRef.current = onBoundsChange;
    }, [onBoundsChange]);

    useEffect(() => {
        // Automatically find user location on mount silently
        map.locate();

        const handleLocationFound = (e: L.LocationEvent) => {
            setUserLocation([e.latlng.lat, e.latlng.lng]);
        };

        map.on('locationfound', handleLocationFound);

        const handleMoveEnd = () => {
            const cb = onBoundsChangeRef.current;
            if (!cb) return;

            const bounds = map.getBounds();
            const bboxString = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
            cb(bboxString);
        };

        map.on('moveend', handleMoveEnd);

        // Trigger initial bounds load
        handleMoveEnd();

        return () => {
            map.off('locationfound', handleLocationFound);
            map.off('moveend', handleMoveEnd);
        };
    }, [map, setUserLocation]);

    return null;
}

export default function InteractiveMap({ properties, center = [21.0285, 105.8542], zoom = 12, onBoundsChange }: MapProps) {
    const router = useRouter();
    const { user } = useAuth();
    const { t } = useLanguage();
    const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

    return (
        <div className="w-full h-full relative">
            <MapContainer
                center={center}
                zoom={zoom}
                scrollWheelZoom={true}
                className="w-full h-full rounded-xl shadow-sm z-0"
                ref={setMapInstance}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {userLocation && (
                    <Marker position={userLocation} icon={userIcon} zIndexOffset={1000} />
                )}
                {properties.map((property) => {
                    // Ensure coordinates are numbers
                    const lat = Number(property.latitude);
                    const lng = Number(property.longitude);

                    if (isNaN(lat) || isNaN(lng)) return null;
                    if (lat === 0 && lng === 0) return null;

                    const isAvailable = property.status?.toLowerCase() === 'available';
                    const statusColor = isAvailable ? 'bg-emerald-500' : 'bg-red-500';
                    const statusText = isAvailable ? t('available') : t('rented');

                    // Safely extract multiple images whether it came from raw backend format or mapped frontend format
                    const images = (property.images?.length ? property.images : [
                        property.image_url_1,
                        property.image_url_2,
                        property.image_url_3,
                        property.image_url
                    ]).filter(Boolean) as string[];

                    const displayImages: string[] = images.length > 0 ? images : ['/images/defaultimage.jpg'];

                    // Compute address
                    const rawAddress = property.address || `${property.district ? property.district + ', ' : ''}${property.city}`;

                    return (
                        <Marker key={property.id} position={[lat, lng]} icon={getMarkerIcon(property.status)}>
                            <Popup className="custom-popup" closeButton={false}>
                                <div className="w-[260px] cursor-pointer bg-white rounded-lg overflow-hidden shadow-sm">
                                    {/* Image Carousel Container */}
                                    <div className="relative w-full h-36">
                                        <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar">
                                            {displayImages.map((img: string, i: number) => (
                                                <img
                                                    key={i}
                                                    src={img}
                                                    className="w-full h-full object-cover flex-shrink-0 snap-center"
                                                    alt={`${property.title} - ${i + 1}`}
                                                />
                                            ))}
                                        </div>

                                        {/* Status Badge */}
                                        <div className={`absolute top-2 left-2 px-2.5 py-1 rounded-md text-white text-[10px] font-bold shadow-md z-10 uppercase tracking-wider ${statusColor}`}>
                                            {statusText}
                                        </div>
                                    </div>

                                    <div className="p-3">
                                        {/* Price and Title */}
                                        <h4 className="font-bold text-[15px] truncate text-gray-900 leading-tight mb-1">{property.title}</h4>
                                        <p className="text-blue-600 font-extrabold text-sm mb-2">{property.price?.toLocaleString('vi-VN')} VND{t('month_abbr')}</p>

                                        {/* Tag Metrics */}
                                        <div className="flex flex-row items-center gap-3 mb-2">
                                            <div className="flex items-center text-xs font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                <Square size={12} className="mr-1.5 text-gray-400" />
                                                {property.area || property.square || 0} m²
                                            </div>
                                            <div className="flex items-center text-xs font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                <Bed size={12} className="mr-1.5 text-gray-400" />
                                                {property.bedrooms || 1} {t('bedrooms')}
                                            </div>
                                        </div>

                                        {/* Address */}
                                        <div className="flex items-start text-gray-500 text-xs mb-3 truncate">
                                            <MapPin size={12} className="mr-1 mt-0.5 flex-shrink-0" />
                                            <span className="truncate">{rawAddress}</span>
                                        </div>

                                        {/* View Details Button */}
                                        <button
                                            className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-2 rounded-lg transition-colors border border-blue-200"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!user) {
                                                    router.push('/login');
                                                    return;
                                                }
                                                router.push(`/properties/${property.id}`);
                                            }}
                                        >
                                            {t('view_details')}
                                        </button>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
                <MapEvents onBoundsChange={onBoundsChange} setUserLocation={setUserLocation} />
            </MapContainer>

            {/* Floating Map Controls Inside Map Wrapper */}
            <div className="absolute bottom-6 right-4 z-10 flex flex-col gap-3">
                <button
                    className="w-11 h-11 bg-white/95 backdrop-blur rounded-full flex justify-center items-center shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                    onClick={() => {
                        if (mapInstance) {
                            mapInstance.locate({ setView: true, maxZoom: 15 });
                        }
                    }}
                >
                    <Locate size={20} className="text-blue-600" />
                </button>
            </div>
        </div>
    );
}
