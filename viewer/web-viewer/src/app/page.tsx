"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import api from '@/api/axios';
import { useAuth } from '@/context/useAuth';
import Navbar from '@/components/Navbar';
import { FilterOptions } from '@/components/FilterModal';

// Dynamically import Map with SSR disabled since Leaflet requires the window object
const InteractiveMap = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center rounded-xl shadow-sm"><span className="text-gray-400 font-medium">Loading Map...</span></div>
});

export default function HomePage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions | null>(null);

  const fetchFavorites = async () => {
    if (!user) {
      setFavorites([]);
      return;
    }
    try {
      const res = await api.get('/users/favorites');
      setFavorites(res.data.map((fav: any) => fav.house_id));
    } catch (err) {
      console.error('Failed to fetch favorites', err);
    }
  };

  const fetchProperties = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await api.get('/houses?skip=0&take=100');
      const rawData = res.data.data || res.data;
      const formatted = rawData.map((h: any) => ({
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
        images: [h.image_url_1, h.image_url_2, h.image_url_3].filter(Boolean),
        image_url: h.image_url_1 || h.image_url_2 || h.image_url_3
      }));
      setProperties(formatted);
    } catch (error) {
      console.error('Failed to fetch properties', error);
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchProperties(true);
    fetchFavorites();

    // Auto-polling every 2000ms to match the React Query refetchInterval of the mobile app
    const interval = setInterval(() => {
      fetchProperties(false);
    }, 2000);

    return () => clearInterval(interval);
  }, [fetchProperties, user]);

  const handleToggleFavorite = async (propertyId: string) => {
    if (!user) {
      alert('Please sign in to save favorites');
      return;
    }

    try {
      const isFaved = favorites.includes(propertyId);
      await api.post('/users/favorites/toggle', { houseId: propertyId });
      if (isFaved) {
        setFavorites(prev => prev.filter(id => id !== propertyId));
      } else {
        setFavorites(prev => [...prev, propertyId]);
      }
    } catch (error) {
      console.error('Failed to toggle favorite', error);
    }
  };

  const filteredProperties = useMemo(() => {
    let result = [...properties];
    if (!filters) return result;

    if (filters.searchQuery) {
      const lowerQuery = filters.searchQuery.toLowerCase();
      result = result.filter(
        (p: any) => p.title.toLowerCase().includes(lowerQuery) || p.address.toLowerCase().includes(lowerQuery)
      );
    }

    if (filters.minPrice !== null) {
      result = result.filter((p: any) => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== null) {
      result = result.filter((p: any) => p.price <= filters.maxPrice!);
    }

    if (filters.province) {
      const cleanProvince = filters.province.replace(/^(Thành phố|Tỉnh)\s+/i, '').trim();
      result = result.filter((p: any) => p.address.includes(cleanProvince));
    }
    if (filters.ward) {
      const cleanWard = filters.ward.replace(/^(Quận|Huyện|Thị xã|Thành phố)\s+/i, '').trim();
      result = result.filter((p: any) => p.address.includes(cleanWard));
    }

    if (filters.minBedrooms !== null) {
      result = result.filter((p: any) => p.bedrooms >= filters.minBedrooms!);
    }

    if (filters.minArea !== null) {
      result = result.filter((p: any) => (p.area || 0) >= filters.minArea!);
    }
    if (filters.maxArea !== null) {
      result = result.filter((p: any) => (p.area || 0) <= filters.maxArea!);
    }

    if (filters.bathroomType !== null) {
      const wantsPrivate = filters.bathroomType === "khép kín";
      result = result.filter((p: any) => p.hasPrivateBathroom === wantsPrivate);
    }

    if (filters.status !== null) {
      // Status might be ALL CAPS 'AVAILABLE' internally but the modal uses lower case. Ensure safe comparisons.
      const targetStatus = filters.status.toUpperCase();
      result = result.filter((p: any) => (p.status || "AVAILABLE").toUpperCase() === targetStatus);
    }

    return result;
  }, [properties, filters]);

  return (
    <div className="w-full h-full relative bg-gray-100 flex flex-col">
      {/* Explicitly attach Navbar directly above map to capture global searches safely without Context drilldown */}
      <Navbar onFilterChange={setFilters} />

      <div className="flex-1 relative">
        {/* Full-width Map View mirroring Mobile Expo layout */}
        <InteractiveMap
          properties={filteredProperties}
          onBoundsChange={() => { }}
        />

        {/* Decorative count overlay similar to MapScreen */}
        <div className="absolute top-4 left-[60px] z-[400] flex gap-2">
          <div className="bg-white/95 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 border border-gray-100">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-semibold text-gray-800">Cho thuê</span>
          </div>
          <div className="bg-white/95 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 border border-gray-100">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
            <span className="text-xs font-semibold text-gray-800">Đã thuê</span>
          </div>
          <div className="bg-blue-600 px-3 py-1.5 rounded-full shadow-sm flex items-center border border-blue-500">
            <span className="text-xs font-bold text-white">{filteredProperties.length} nhà</span>
          </div>
        </div>
      </div>
    </div>
  );
}
