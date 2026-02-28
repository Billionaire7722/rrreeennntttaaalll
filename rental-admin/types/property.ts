export type PropertyStatus = "available" | "rented";

export interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  bedrooms: number;
  hasPrivateBathroom: boolean;
  status: PropertyStatus;
  latitude: number;
  longitude: number;
  images: string[];
  area?: number;
  description?: string;
}
