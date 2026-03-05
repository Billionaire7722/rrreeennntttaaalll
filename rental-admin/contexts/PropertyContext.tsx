import { useEffect, useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import createContextHook from "@nkzw/create-context-hook";
import { Property, PropertyStatus } from "@shared/types/property";
import { HOUSES_API_URL } from "@shared/constants/api";
import { useAuth } from "./AuthContext";

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

export const [PropertyProvider, useProperties] = createContextHook(() => {
  const { token } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  const query = useQuery({
    queryKey: ["houses", authHeaders],
    queryFn: async () => {
      try {
        const response = await fetch(`${HOUSES_API_URL}?skip=0&take=100`, { headers: authHeaders });
        if (!response.ok) throw new Error("Failed to fetch houses");
        const json = await response.json();
        const rawData = json.data || json;

        return rawData.map((h: any) => ({
          id: h.id,
          title: h.name,
          address: `${h.district && h.city && !h.address.includes(h.city) ? h.district + ', ' : ''}${h.address}`,
          city: h.city || '',
          district: h.district || '',
          latitude: h.latitude,
          longitude: h.longitude,
          price: h.price,
          bedrooms: h.bedrooms,
          area: h.square,
          description: h.description,
          contact_phone: h.contact_phone,
          hasPrivateBathroom: h.is_private_bathroom,
          status: h.status || "available",
          images: [h.image_url_1, h.image_url_2, h.image_url_3].filter(Boolean),
          postedByAdmins: Array.isArray(h.postedByAdmins) ? h.postedByAdmins : [],
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

  const addProperty = useCallback(
    async (property: Omit<Property, "id">) => {
      try {
        const response = await fetch(HOUSES_API_URL, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            name: property.title,
            address: property.address,
            city: (property as any).city ?? null,
            district: (property as any).district ?? null,
            latitude: property.latitude,
            longitude: property.longitude,
            price: property.price,
            bedrooms: property.bedrooms,
            square: property.area,
            description: property.description,
            contact_phone: property.contact_phone,
            is_private_bathroom: property.hasPrivateBathroom,
            status: property.status,
            image_url_1: property.images && property.images.length > 0 ? property.images[0] : null,
            image_url_2: property.images && property.images.length > 1 ? property.images[1] : null,
            image_url_3: property.images && property.images.length > 2 ? property.images[2] : null,
          }),
        });

        if (!response.ok) {
          const message = await response.text().catch(() => "");
          throw new Error(
            message
              ? `Failed to add housing (${response.status}): ${message}`
              : `Failed to add housing (${response.status})`
          );
        }

        const newBackendHouse = await response.json();
        const mappedProperty: Property = {
          id: newBackendHouse.id,
          title: newBackendHouse.name,
          address: `${newBackendHouse.district && newBackendHouse.city && !newBackendHouse.address.includes(newBackendHouse.city) ? newBackendHouse.district + ', ' : ''}${newBackendHouse.address}`,
          city: newBackendHouse.city || '',
          district: newBackendHouse.district || '',
          latitude: newBackendHouse.latitude,
          longitude: newBackendHouse.longitude,
          price: newBackendHouse.price,
          bedrooms: newBackendHouse.bedrooms,
          area: newBackendHouse.square,
          description: newBackendHouse.description,
          hasPrivateBathroom: newBackendHouse.is_private_bathroom,
          status: newBackendHouse.status || "available",
          images: [newBackendHouse.image_url_1, newBackendHouse.image_url_2, newBackendHouse.image_url_3].filter(Boolean),
          postedByAdmins: Array.isArray(newBackendHouse.postedByAdmins) ? newBackendHouse.postedByAdmins : [],
        };

        setProperties((prev) => [mappedProperty, ...prev]);
        query.refetch();
        return mappedProperty;
      } catch (err) {
        console.error("Could not save to backend API:", err);
        throw err;
      }
    },
    [authHeaders, query]
  );

  const removeProperty = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`${HOUSES_API_URL}/${id}`, {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (response.ok) {
          setProperties((prev) => prev.filter((p) => p.id !== id));
        }
      } catch (err) {
        console.error("Failed to delete property:", err);
      }
    },
    [token]
  );

  const updateStatus = useCallback(
    async (id: string, status: PropertyStatus) => {
      try {
        const response = await fetch(`${HOUSES_API_URL}/${id}/status`, {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({ status }),
        });
        if (response.ok) {
          setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
        }
      } catch (err) {
        console.error("Failed to update status:", err);
      }
    },
    [authHeaders]
  );

  const updateProperty = useCallback(
    async (id: string, updated: Partial<Property>) => {
      try {
        const body: Record<string, any> = {};
        if (updated.title !== undefined) body.name = updated.title;
        if (updated.address !== undefined) body.address = updated.address;
        if ((updated as any).city !== undefined) body.city = (updated as any).city;
        if ((updated as any).district !== undefined) body.district = (updated as any).district;
        if (updated.price !== undefined) body.price = updated.price;
        if (updated.bedrooms !== undefined) body.bedrooms = updated.bedrooms;
        if ((updated as any).area !== undefined) body.square = (updated as any).area;
        if ((updated as any).description !== undefined) body.description = (updated as any).description;
        if (updated.latitude !== undefined) body.latitude = updated.latitude;
        if (updated.longitude !== undefined) body.longitude = updated.longitude;
        if (updated.contact_phone !== undefined) body.contact_phone = updated.contact_phone;
        if (updated.images) {
          body.image_url_1 = updated.images[0] || null;
          body.image_url_2 = updated.images[1] || null;
          body.image_url_3 = updated.images[2] || null;
        }

        const response = await fetch(`${HOUSES_API_URL}/${id}`, {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify(body),
        });
        if (response.ok) {
          setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
          query.refetch();
        }
      } catch (err) {
        console.error("Failed to update property:", err);
      }
    },
    [authHeaders, query]
  );

  const filteredProperties = useMemo(() => {
    let result = [...properties];

    if (filters.searchQuery) {
      const lowerQuery = filters.searchQuery.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(lowerQuery) || p.address.toLowerCase().includes(lowerQuery));
    }

    if (filters.minPrice !== null) result = result.filter((p) => p.price >= filters.minPrice!);
    if (filters.maxPrice !== null) result = result.filter((p) => p.price <= filters.maxPrice!);

    if (filters.province) {
      const cleanProvince = filters.province.replace(/^(ThÃ nh phá»‘|Tá»‰nh)\s+/i, "").trim();
      result = result.filter((p) => p.address.includes(cleanProvince));
    }
    if (filters.ward) {
      const cleanWard = filters.ward.replace(/^(Quáº­n|Huyá»‡n|Thá»‹ xÃ£|ThÃ nh phá»‘)\s+/i, "").trim();
      result = result.filter((p) => p.address.includes(cleanWard));
    }

    if (filters.minBedrooms !== null) result = result.filter((p) => p.bedrooms >= filters.minBedrooms!);
    if (filters.minArea !== null) result = result.filter((p) => (p.area || 0) >= filters.minArea!);
    if (filters.maxArea !== null) result = result.filter((p) => (p.area || 0) <= filters.maxArea!);

    if (filters.bathroomType !== null) {
      const wantsPrivate = filters.bathroomType === "khép kín";
      result = result.filter((p) => p.hasPrivateBathroom === wantsPrivate);
    }
    if (filters.status !== null) result = result.filter((p) => p.status === filters.status);

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
