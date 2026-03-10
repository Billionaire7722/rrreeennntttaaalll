"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useMemo } from 'react';
import loadDynamic from 'next/dynamic';
import api from '@/api/axios';
import { useAuth } from '@/context/useAuth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { FilterOptions } from '@/components/FilterModal';
import { useLanguage } from '@/context/LanguageContext';
import { Info, X } from 'lucide-react';
import OnboardingTour from '@/components/OnboardingTour';

const InteractiveMap = loadDynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center rounded-xl shadow-sm">
      <span className="text-gray-400 font-medium">Loading Map...</span>
    </div>
  )
});

const removeVietnameseTones = (str: string) =>
  String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/(?:\u0111|\u0110)/g, 'd')
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const normalizeLocationName = (str: string) =>
  removeVietnameseTones(str).replace(/^(thanh pho|tinh|quan|huyen|thi xa|phuong|xa)\s+/, '');

export default function HomePage() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterOptions | null>(null);
  const [isAboutCardOpen, setIsAboutCardOpen] = useState(true);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  const fetchFavorites = async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    try {
      const res = await api.get('/users/favorites');
      setFavorites(res.data.map((fav: any) => fav.houseId));
    } catch (err) {
      console.error('Failed to fetch favorites', err);
    }
  };

  const fetchProperties = useCallback(async () => {
    try {
      const res = await api.get('/houses?skip=0&take=100');
      const rawData = res.data.data || res.data;
      const formatted = rawData.map((h: any) => ({
        id: h.id,
        title: h.name,
        address: h.address || `${h.district ? `${h.district}, ` : ''}${h.city || ''}`,
        city: h.city,
        district: h.district,
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
        image_url: h.image_url_1 || h.image_url_2 || h.image_url_3 || '/images/defaultimage.jpg'
      }));
      setProperties(formatted);
    } catch (error) {
      console.error('Failed to fetch properties', error);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
    fetchFavorites();

    const interval = setInterval(() => {
      fetchProperties();
    }, 2000);

    return () => clearInterval(interval);
  }, [fetchProperties, user]);

  useEffect(() => {
    if (typeof window === 'undefined' || !user) {
      setIsAboutCardOpen(false);
      return;
    }

    const aboutSeenKey = 'about_seen_once';
    const hasSeen = sessionStorage.getItem(aboutSeenKey) === '1';
    if (hasSeen) {
      setIsAboutCardOpen(false);
      return;
    }

    setIsAboutCardOpen(true);
    sessionStorage.setItem(aboutSeenKey, '1');

    const timer = setTimeout(() => {
      setIsAboutCardOpen(false);
    }, 7000);
    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    fetch('/data/province.json')
      .then((res) => res.json())
      .then((data) => setProvinces(Array.isArray(data) ? data : Object.values(data)))
      .catch(() => { });

    fetch('/data/ward.json')
      .then((res) => res.json())
      .then((data) => setWards(Array.isArray(data) ? data : Object.values(data)))
      .catch(() => { });
  }, []);

  const filteredProperties = useMemo(() => {
    let result = [...properties];
    if (!filters) return result;

    if (filters.searchQuery) {
      const normalizedQuery = removeVietnameseTones(filters.searchQuery);
      const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);

      if (queryWords.length > 0) {
        const provinceByCode = new Map<string, any>(
          provinces.map((province: any) => [String(province.code), province])
        );

        const matchedProvinceCodes = new Set<string>();
        for (const province of provinces) {
          const searchableProvinceValues = [province?.name, province?.name_with_type, province?.slug]
            .filter(Boolean)
            .map((value) => removeVietnameseTones(value));

          if (
            searchableProvinceValues.some(
              (value) => value.includes(normalizedQuery) || normalizedQuery.includes(value)
            )
          ) {
            matchedProvinceCodes.add(String(province.code));
          }
        }

        const matchedWardProvinceCodes = new Set<string>();
        for (const ward of wards) {
          const searchableWardValues = [ward?.name, ward?.name_with_type, ward?.slug, ward?.path, ward?.path_with_type]
            .filter(Boolean)
            .map((value) => removeVietnameseTones(value));

          if (
            searchableWardValues.some(
              (value) => value.includes(normalizedQuery) || normalizedQuery.includes(value)
            )
          ) {
            matchedWardProvinceCodes.add(String(ward.parent_code));
          }
        }

        result = result.filter((property: any) => {
          const title = removeVietnameseTones(property.title || '');
          const address = removeVietnameseTones(property.address || '');
          const city = removeVietnameseTones(property.city || '');
          const searchableProperty = `${title} ${address} ${city}`;

          const textMatched =
            searchableProperty.includes(normalizedQuery) ||
            queryWords.some((word) => searchableProperty.includes(word));

          if (textMatched) return true;

          const propertyProvinceCode = provinces.find(
            (province: any) =>
              normalizeLocationName(province.name || '') === normalizeLocationName(property.city || '')
          )?.code;

          if (
            propertyProvinceCode &&
            (matchedProvinceCodes.has(String(propertyProvinceCode)) ||
              matchedWardProvinceCodes.has(String(propertyProvinceCode)))
          ) {
            return true;
          }

          for (const provinceCode of matchedWardProvinceCodes) {
            const matchedProvince = provinceByCode.get(provinceCode);
            if (!matchedProvince) continue;

            const normalizedProvinceName = normalizeLocationName(matchedProvince.name || '');
            if (normalizedProvinceName && city.includes(normalizedProvinceName)) {
              return true;
            }
          }

          return false;
        });
      }
    }

    if (filters.minPrice !== null) {
      result = result.filter((property: any) => property.price >= filters.minPrice!);
    }

    if (filters.maxPrice !== null) {
      result = result.filter((property: any) => property.price <= filters.maxPrice!);
    }

    if (filters.province) {
      const cleanProvince = normalizeLocationName(filters.province);
      result = result.filter((property: any) =>
        normalizeLocationName(property.city || '').includes(cleanProvince)
      );
    }

    if (filters.ward) {
      const cleanWard = normalizeLocationName(filters.ward);
      result = result.filter((property: any) =>
        removeVietnameseTones(property.address || '').includes(cleanWard)
      );
    }

    if (filters.minBedrooms !== null) {
      result = result.filter((property: any) => property.bedrooms >= filters.minBedrooms!);
    }

    if (filters.minArea !== null) {
      result = result.filter((property: any) => (property.area || 0) >= filters.minArea!);
    }

    if (filters.maxArea !== null) {
      result = result.filter((property: any) => (property.area || 0) <= filters.maxArea!);
    }

    if (filters.bathroomType !== null) {
      const wantsPrivate = removeVietnameseTones(filters.bathroomType) === 'khep kin';
      result = result.filter((property: any) => property.hasPrivateBathroom === wantsPrivate);
    }

    return result;
  }, [properties, filters, provinces, wards]);

  return (
    <div className="w-full h-[calc(100vh-60px)] relative bg-gray-100 flex flex-col">
        <OnboardingTour userId={user?.id} authLoading={loading} />
        <Navbar onFilterChange={setFilters} />

      <div id="tour-map" className="flex-1 relative">
        <InteractiveMap
          properties={filteredProperties}
        />

        <div className="absolute top-4 left-4 sm:left-[60px] z-[40] flex gap-2">
          <div className="bg-white/95 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 border border-gray-100">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-semibold text-gray-800">{t('available')}</span>
          </div>
          <div className="bg-white/95 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 border border-gray-100">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
            <span className="text-xs font-semibold text-gray-800">{t('rented')}</span>
          </div>
          <div className="bg-blue-600 px-3 py-1.5 rounded-full shadow-sm flex items-center border border-blue-500">
            <span className="text-xs font-bold text-white">{filteredProperties.length} {t('houses')}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
