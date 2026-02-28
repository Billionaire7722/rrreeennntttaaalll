import { useEffect, useState, useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { useQuery } from "@tanstack/react-query";
import createContextHook from "@nkzw/create-context-hook";
import { Property, PropertyStatus } from "@shared/types/property";


export type FilterOptions = {
  searchQuery: string;
  minPrice: number | null;
  maxPrice: number | null;
  province: string | null;
  ward: string | null;
  minBedrooms: number | null;
  minArea: number | null;
  maxArea: number | null;
  bathroomType: "khép kín" | "chung" | null;
  status: PropertyStatus | null;
};

const DEFAULT_FILTERS: FilterOptions = {
  searchQuery: "",
  minPrice: null,
  maxPrice: null,
  province: null,
  ward: null,
  minBedrooms: null,
  minArea: null,
  maxArea: null,
  bathroomType: null,
  status: null,
};

// API URL for NestJS backend
// Use the exact local IP so physical devices on the LAN can connect via Expo Go
const getApiUrl = () => {
  if (Platform.OS === 'web') {
    return "http://127.0.0.1:3000/houses";
  }
  return "http://192.168.100.129:3000/houses";
};
const API_URL = getApiUrl();

export const [PropertyProvider, useProperties] = createContextHook(() => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);

  // Poll the backend every 2 seconds for real-time updates across apps
  const query = useQuery({
    queryKey: ["houses"],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_URL}?skip=0&take=100`);
        if (!response.ok) throw new Error("Failed to fetch houses");
        const json = await response.json();
        const rawData = json.data || json;

        // Map Backend 'House' schema to Frontend 'Property' UI expectation
        return rawData.map((h: any) => ({
          id: h.id,
          title: h.name,
          address: `${h.district && h.city && !h.address.includes(h.city) ? h.district + ', ' : ''}${h.address}`,
          latitude: h.latitude,
          longitude: h.longitude,
          price: h.price,
          bedrooms: h.bedrooms,
          area: h.square,
          description: h.description,
          hasPrivateBathroom: h.is_private_bathroom,
          status: h.status || 'available',
          images: [h.image_url_1, h.image_url_2, h.image_url_3].filter(Boolean)
        })) as Property[];
      } catch (err) {
        console.error("Failed to load houses from API:", err);
        return [];
      }
    },
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (query.data) {
      setProperties(query.data);
    }
  }, [query.data]);

  const addProperty = useCallback(async (property: Omit<Property, "id">) => {
    // Send to NestJS backend
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: property.title,
          address: property.address,
          latitude: property.latitude,
          longitude: property.longitude,
          price: property.price,
          bedrooms: property.bedrooms,
          square: property.area,
          description: property.description,
          is_private_bathroom: property.hasPrivateBathroom,
          status: property.status,
          image_url_1: property.images && property.images.length > 0 ? property.images[0] : null,
          image_url_2: property.images && property.images.length > 1 ? property.images[1] : null,
          image_url_3: property.images && property.images.length > 2 ? property.images[2] : null
        })
      });
      if (!response.ok) {
        throw new Error("Failed to add housing");
      }

      const newBackendHouse = await response.json();

      // Optimistic UI mapping
      const mappedProperty: Property = {
        id: newBackendHouse.id,
        title: newBackendHouse.name,
        address: `${newBackendHouse.district && newBackendHouse.city && !newBackendHouse.address.includes(newBackendHouse.city) ? newBackendHouse.district + ', ' : ''}${newBackendHouse.address}`,
        latitude: newBackendHouse.latitude,
        longitude: newBackendHouse.longitude,
        price: newBackendHouse.price,
        bedrooms: newBackendHouse.bedrooms,
        area: newBackendHouse.square,
        description: newBackendHouse.description,
        hasPrivateBathroom: newBackendHouse.is_private_bathroom,
        status: newBackendHouse.status || 'available',
        images: [newBackendHouse.image_url_1, newBackendHouse.image_url_2, newBackendHouse.image_url_3].filter(Boolean)
      };

      setProperties(prev => [mappedProperty, ...prev]);

      // Force immediate re-fetch in background to ensure sync
      query.refetch();
    } catch (err) {
      console.error("Could not save to backend API:", err);
    }
  }, []);

  const removeProperty = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setProperties((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete property:", err);
    }
  }, []);

  const updateStatus = useCallback(async (id: string, status: PropertyStatus) => {
    try {
      const response = await fetch(`${API_URL}/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }, []);

  const updateProperty = useCallback(async (id: string, updated: Partial<Property>) => {
    try {
      // Map frontend field names to backend schema
      const body: Record<string, any> = {};
      if (updated.title !== undefined) body.name = updated.title;
      if (updated.address !== undefined) body.address = updated.address;
      if (updated.price !== undefined) body.price = updated.price;
      if (updated.bedrooms !== undefined) body.bedrooms = updated.bedrooms;
      if ((updated as any).area !== undefined) body.square = (updated as any).area;
      if ((updated as any).description !== undefined) body.description = (updated as any).description;
      if (updated.latitude !== undefined) body.latitude = updated.latitude;
      if (updated.longitude !== undefined) body.longitude = updated.longitude;
      if (updated.images) {
        body.image_url_1 = updated.images[0] || null;
        body.image_url_2 = updated.images[1] || null;
        body.image_url_3 = updated.images[2] || null;
      }

      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        setProperties((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
        );
        query.refetch();
      }
    } catch (err) {
      console.error('Failed to update property:', err);
    }
  }, []);



  const filteredProperties = useMemo(() => {
    let result = [...properties];

    if (filters.searchQuery) {
      const lowerQuery = filters.searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.title.toLowerCase().includes(lowerQuery) || p.address.toLowerCase().includes(lowerQuery)
      );
    }

    if (filters.minPrice !== null) {
      result = result.filter((p) => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== null) {
      result = result.filter((p) => p.price <= filters.maxPrice!);
    }

    if (filters.province) {
      // Mock properties have addresses like "Thanh Xuân, Hà Nội"
      // the JSON has "Thành phố Hà Nội"
      const cleanProvince = filters.province.replace(/^(Thành phố|Tỉnh)\s+/i, '').trim();
      result = result.filter((p) => p.address.includes(cleanProvince));
    }
    if (filters.ward) {
      // Mock properties have addresses like "Thanh Xuân, Hà Nội"
      // the JSON has "Quận Thanh Xuân" or "Huyện Sóc Sơn"
      const cleanWard = filters.ward.replace(/^(Quận|Huyện|Thị xã|Thành phố)\s+/i, '').trim();
      result = result.filter((p) => p.address.includes(cleanWard));
    }

    if (filters.minBedrooms !== null) {
      result = result.filter((p) => p.bedrooms >= filters.minBedrooms!);
    }

    if (filters.minArea !== null) {
      result = result.filter((p) => (p.area || 0) >= filters.minArea!);
    }
    if (filters.maxArea !== null) {
      result = result.filter((p) => (p.area || 0) <= filters.maxArea!);
    }

    if (filters.bathroomType !== null) {
      const wantsPrivate = filters.bathroomType === "khép kín";
      result = result.filter((p) => p.hasPrivateBathroom === wantsPrivate);
    }

    if (filters.status !== null) {
      result = result.filter((p) => p.status === filters.status);
    }

    return result;
  }, [properties, filters]);

  return {
    properties,
    filteredProperties,
    filters,
    setFilters,
    DEFAULT_FILTERS,
    addProperty,
    removeProperty,
    updateStatus,
    updateProperty,
    isLoading: query.isLoading,
  };
});
