import { normalizePropertyType } from "@/i18n";

export function getPropertyTypeRules(value?: string | null) {
  const normalizedType = normalizePropertyType(value);

  return {
    normalizedType,
    isApartmentLike: normalizedType === "apartment" || normalizedType === "condominium",
    isCommercialSpace: normalizedType === "commercialSpace",
    isRoomMiniApartment: normalizedType === "roomMiniApartment",
  };
}
