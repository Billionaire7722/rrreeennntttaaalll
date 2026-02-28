import { useEffect, useState, useMemo } from "react";
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

// Assuming the NestJS backend is running here
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

    // Poll the backend every 2 seconds for real-time updates
    const query = useQuery({
        queryKey: ["houses"],
        queryFn: async () => {
            try {
                // Remove bounding box for Houses API paginated logic initially
                const response = await fetch(`${API_URL}?skip=0&take=100`);
                if (!response.ok) throw new Error("Network response was not ok");
                const json = await response.json();
                const rawData = json.data || json;

                // Map Backend 'House' schema to Frontend 'Property' UI expectation
                return rawData.map((h: any) => ({
                    id: h.id,
                    title: h.name,
                    address: `${h.district ? h.district + ', ' : ''}${h.city}`,
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
                console.error("Failed to fetch houses:", err);
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
            const cleanProvince = filters.province.replace(/^(Thành phố|Tỉnh)\s+/i, '').trim();
            result = result.filter((p) => p.address.includes(cleanProvince));
        }
        if (filters.ward) {
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
        isLoading: query.isLoading,
    };
});
