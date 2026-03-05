export type PropertyStatus = "available" | "rented";

export interface PostedByAdmin {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  bedrooms: number;
  hasPrivateBathroom: boolean;
  status: PropertyStatus;
  contact_phone?: string;
  latitude: number;
  longitude: number;
  images: string[];
  area?: number;
  description?: string;
  postedByAdmins?: PostedByAdmin[];
}
