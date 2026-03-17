import Link from "next/link";
import React from "react";
import { MapPin, Bed, Bath, Square, Heart, Pencil, Trash2 } from "lucide-react";
import SafeImage from "@/components/SafeImage";
import { useLanguage } from "@/context/LanguageContext";
import { getPropertyStatusTranslationKey, getPropertyTypeTranslationKey } from "@/i18n";

export interface Property {
  id: string;
  title: string;
  property_type?: string;
  description?: string;
  price: number;
  address: string;
  city: string;
  bedrooms: number;
  bathrooms?: number;
  hasPrivateBathroom?: boolean;
  area: number;
  image_url: string;
  status: string;
  latitude?: number;
  longitude?: number;
}

interface PropertyCardProps {
  property: Property;
  variant?: "grid" | "list" | "compact";
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onEdit?: (property: Property) => void;
  onDelete?: (id: string) => void;
}

function buildCompactPrice(price: number, formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string, millionLabel: string) {
  if (!price) return "0";
  if (price >= 1_000_000) {
    return `${formatNumber(price / 1_000_000, { maximumFractionDigits: 1 })} ${millionLabel}`;
  }

  return formatNumber(price);
}

export default function PropertyCard({
  property,
  variant = "grid",
  isFavorite,
  onToggleFavorite,
  onEdit,
  onDelete,
}: PropertyCardProps) {
  const defaultImage = "/images/defaultimage.jpg";
  const { t, formatNumber } = useLanguage();
  const statusKey = getPropertyStatusTranslationKey(property.status);
  const typeKey = getPropertyTypeTranslationKey(property.property_type);
  const statusLabel = statusKey ? t(statusKey) : property.status;
  const propertyTitle = typeKey ? t(typeKey) : property.property_type || property.title;
  const priceLabel = `${property.price ? formatNumber(property.price) : "0"} VND${t("property.units.monthAbbr")}`;
  const compactPrice = buildCompactPrice(property.price, formatNumber, t("property.units.million"));
  const bathroomLabel = property.hasPrivateBathroom ? t("property.fields.privateBath") : t("property.fields.sharedBath");
  const areaValue = `${property.area} m\u00B2`;
  const locationLabel =
    property.address && property.city && property.address.toLowerCase().includes(property.city.toLowerCase())
      ? property.address
      : [property.address, property.city].filter(Boolean).join(", ");

  const statusBadge = (
    <span
      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm ${
        property.status?.toUpperCase() === "AVAILABLE"
          ? "bg-emerald-100 text-emerald-700"
          : property.status?.toUpperCase() === "PENDING"
            ? "bg-amber-100 text-amber-700"
            : "bg-rose-100 text-rose-700"
      }`}
    >
      {statusLabel}
    </span>
  );

  const actionButtons = (
    <div className="flex gap-1.5">
      {onEdit ? (
        <button
          onClick={(event) => {
            event.preventDefault();
            onEdit(property);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-blue-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-blue-50"
          title={t("common.edit")}
        >
          <Pencil size={14} />
        </button>
      ) : null}

      {onDelete ? (
        <button
          onClick={(event) => {
            event.preventDefault();
            onDelete(property.id);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-rose-500 shadow-sm backdrop-blur-sm transition-colors hover:bg-rose-50"
          title={t("common.delete")}
        >
          <Trash2 size={14} />
        </button>
      ) : null}

      {onToggleFavorite ? (
        <button
          onClick={(event) => {
            event.preventDefault();
            onToggleFavorite(property.id);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 shadow-sm backdrop-blur-sm transition-colors"
        >
          <Heart className={`h-4 w-4 ${isFavorite ? "fill-rose-500 text-rose-500" : "text-gray-400"}`} />
        </button>
      ) : null}
    </div>
  );

  if (variant === "compact") {
    return (
      <div className="group overflow-hidden rounded-xl border border-gray-100 bg-white transition-all duration-200 hover:border-teal-100 hover:shadow-md">
        <Link href={`/properties/${property.id}`} className="flex items-center gap-3 p-3">
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
            <SafeImage
              src={property.image_url || defaultImage}
              alt={propertyTitle}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              fallbackSrc={defaultImage}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h4 className="truncate text-sm font-bold text-gray-900">{propertyTitle}</h4>
              <span className="whitespace-nowrap text-sm font-bold text-teal-600">{compactPrice}</span>
            </div>

            <div className="mt-0.5 flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <Bed size={10} />
                {property.bedrooms}
              </span>
              <span className="h-1 w-1 rounded-full bg-gray-300" />
              <span className="text-[10px] text-gray-400">{areaValue}</span>
            </div>

            <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-gray-400">
              <MapPin size={10} /> {locationLabel}
            </p>
          </div>

          <div className="ml-1 flex-shrink-0">{actionButtons}</div>
        </Link>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="group overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:border-teal-100 hover:shadow-lg">
        <Link href={`/properties/${property.id}`} className="flex h-full flex-col sm:flex-row">
          <div className="relative h-48 w-full flex-shrink-0 overflow-hidden bg-gray-100 sm:h-auto sm:w-48 md:w-56">
            <SafeImage
              src={property.image_url || defaultImage}
              alt={propertyTitle}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              fallbackSrc={defaultImage}
            />
            <div className="absolute left-3 top-3">{statusBadge}</div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-between p-5">
            <div>
              <div className="flex items-start justify-between gap-4">
                <h3 className="truncate text-lg font-bold text-gray-900">{propertyTitle}</h3>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xl font-black text-teal-600">{priceLabel}</p>
                </div>
              </div>

              <div className="mb-4 mt-1 flex items-center text-sm text-gray-400">
                <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
                <span className="truncate">{locationLabel}</span>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1 text-sm font-medium text-gray-600">
                  <Bed className="h-4 w-4 text-teal-500" />
                  {property.bedrooms} {t("property.fields.bedrooms")}
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1 text-sm font-medium text-gray-600">
                  <Bath className="h-4 w-4 text-teal-500" />
                  {bathroomLabel}
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1 text-sm font-medium text-gray-600">
                  <Square className="h-4 w-4 text-teal-500" />
                  {areaValue}
                </span>
              </div>
            </div>

            <div className="mt-4 flex justify-end sm:mt-0">{actionButtons}</div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:border-teal-100 hover:shadow-xl">
      <Link href={`/properties/${property.id}`} className="relative block h-56 w-full flex-shrink-0 overflow-hidden">
        <SafeImage
          src={property.image_url || defaultImage}
          alt={propertyTitle}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          fallbackSrc={defaultImage}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute left-4 top-4">{statusBadge}</div>
        <div className="absolute right-4 top-4">{actionButtons}</div>
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4">
          <h3 className="mb-1 truncate text-xl font-bold text-gray-900">{propertyTitle}</h3>
          <div className="flex items-center text-sm text-gray-400">
            <MapPin className="mr-1 h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{locationLabel}</span>
          </div>
        </div>

        <div className="mt-auto">
          <div className="mb-4 flex items-center justify-between border-b border-gray-50 pb-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("property.labels.price")}</span>
              <p className="text-xl font-black leading-tight text-teal-600">{priceLabel}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center rounded-2xl bg-gray-50/50 p-2 transition-colors group-hover:bg-teal-50">
              <Bed className="mb-1 h-4 w-4 text-teal-500" />
              <span className="text-xs font-bold text-gray-700">{property.bedrooms}</span>
              <span className="text-[9px] font-semibold uppercase text-gray-400">{t("property.fields.bedrooms")}</span>
            </div>

            <div className="flex flex-col items-center rounded-2xl bg-gray-50/50 p-2 transition-colors group-hover:bg-teal-50">
              <Bath className="mb-1 h-4 w-4 text-teal-500" />
              <span className="text-xs font-bold text-gray-700">{bathroomLabel}</span>
              <span className="text-[9px] font-semibold uppercase text-gray-400">{t("property.fields.bathrooms")}</span>
            </div>

            <div className="flex flex-col items-center rounded-2xl bg-gray-50/50 p-2 transition-colors group-hover:bg-teal-50">
              <Square className="mb-1 h-4 w-4 text-teal-500" />
              <span className="text-xs font-bold text-gray-700">{areaValue}</span>
              <span className="text-[9px] font-semibold uppercase text-gray-400">{t("property.fields.area")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
