"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin, BedDouble, Bath, Share2, Heart, X, Square } from "lucide-react";
import api from "@/api/axios";
import SafeImage from "@/components/SafeImage";
import { useAuth } from "@/context/useAuth";
import { useLanguage } from "@/context/LanguageContext";
import { getPropertyStatusTranslationKey, getPropertyTypeTranslationKey, normalizePropertyType } from "@/i18n";

function getInitials(name: string): string {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

interface PropertyDetailsData {
  owner?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  } | null;
  postedByAdmins?: Array<{
    id: string;
    name: string;
    avatarUrl?: string | null;
  }>;
  image_url_1?: string;
  image_url_2?: string;
  image_url_3?: string;
  image_url_4?: string;
  image_url_5?: string;
  image_url_6?: string;
  image_url_7?: string;
  image_url?: string;
  status?: string;
  property_type?: string;
  name?: string;
  title?: string;
  address?: string;
  ward?: string;
  district?: string;
  city?: string;
  price?: number;
  payment_method?: string;
  bedrooms?: number;
  bathrooms?: number;
  is_private_bathroom?: boolean;
  hasPrivateBathroom?: boolean;
  square?: number;
  description?: string;
  roomDetails?: {
    electricityPrice?: number | null;
    waterPrice?: number | null;
    paymentMethod?: string | null;
    otherFees?: string | null;
  } | null;
}

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t, formatNumber } = useLanguage();
  const propertyId = params.id as string;
  const [property, setProperty] = useState<PropertyDetailsData | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fullScreenIndex, setFullScreenIndex] = useState(0);
  const fullscreenCarouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    const fetchDetails = async () => {
      try {
        const response = await api.get(`/houses/${propertyId}`);
        const data = response.data;
        setProperty(data);

        const rawImages = [
          data.image_url_1,
          data.image_url_2,
          data.image_url_3,
          data.image_url_4,
          data.image_url_5,
          data.image_url_6,
          data.image_url_7,
          data.image_url,
        ].filter(Boolean) as string[];

        setImages(rawImages.length > 0 ? rawImages : ["/images/defaultimage.jpg"]);

        const favoritesResponse = await api.get("/users/favorites");
        setIsFavorite(favoritesResponse.data.some((favorite: { houseId: string }) => favorite.houseId == propertyId));
      } catch (error) {
        console.error("Failed to fetch details", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [propertyId, router, user]);

  const handleToggleFavorite = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      setIsFavorite((value) => !value);
      await api.post("/users/favorites/toggle", { houseId: propertyId });
    } catch (error) {
      setIsFavorite((value) => !value);
      console.error("Failed to toggle favorite", error);
    }
  };

  const scrollToIndex = useCallback(
    (index: number) => {
      if (!carouselRef.current) return;
      const clampedIndex = Math.max(0, Math.min(index, images.length - 1));
      carouselRef.current.scrollTo({ left: clampedIndex * carouselRef.current.clientWidth, behavior: "smooth" });
      setActiveImageIndex(clampedIndex);
    },
    [images.length]
  );

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const index = Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth);
    setActiveImageIndex(index);
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - event.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) scrollToIndex(activeImageIndex + (diff > 0 ? 1 : -1));
    touchStartX.current = null;
  };

  const handleFullScreenScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const index = Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth);
    setFullScreenIndex(index);
  };

  const openFullScreen = (index: number) => {
    setFullScreenIndex(index);
    setIsFullScreen(true);

    setTimeout(() => {
      if (!fullscreenCarouselRef.current) return;
      fullscreenCarouselRef.current.scrollTo({ left: index * window.innerWidth, behavior: "instant" as ScrollBehavior });
    }, 50);
  };

  const closeFullScreen = () => {
    setIsFullScreen(false);
    setActiveImageIndex(fullScreenIndex);

    if (carouselRef.current) {
      carouselRef.current.scrollTo({
        left: fullScreenIndex * carouselRef.current.clientWidth,
        behavior: "instant" as ScrollBehavior,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <span className="font-medium text-gray-500">{t("common.loading")}</span>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-white">
        <span className="mb-4 font-medium text-gray-500">{t("property.detail.notFound")}</span>
        <button
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/");
            }
          }}
          className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white"
        >
          {t("common.goBack")}
        </button>
      </div>
    );
  }

  const statusKey = getPropertyStatusTranslationKey(property.status);
  const propertyTypeKey = getPropertyTypeTranslationKey(property.property_type);
  const statusLabel = statusKey ? t(statusKey) : property.status;
  const statusColor =
    property.status?.toLowerCase() === "available"
      ? "bg-emerald-500"
      : property.status?.toLowerCase() === "pending"
        ? "bg-amber-500"
        : "bg-red-500";
  const title = propertyTypeKey ? t(propertyTypeKey) : property.property_type || property.name || property.title;
  const address = [property.address, property.ward || property.district, property.city].filter(Boolean).join(", ");
  const postedByAdmins = Array.isArray(property.postedByAdmins) ? property.postedByAdmins : [];
  const owner = property.owner || postedByAdmins[0];
  const formattedPrice = `${formatNumber(property.price || 0)} VND`;
  const bathroomValue = property.is_private_bathroom || property.hasPrivateBathroom ? t("property.fields.privateBath") : `${property.bathrooms || 1}`;
  const isRoomMiniApartment = normalizePropertyType(property.property_type) === "roomMiniApartment";
  const roomDetails = property.roomDetails;
  const paymentMethod = roomDetails?.paymentMethod || property.payment_method || t("property.detail.notProvided");

  const handleContactNow = () => {
    const query = new URLSearchParams();
    if (owner?.id) query.set("recipientId", owner.id);
    query.set("houseId", propertyId);
    query.set("houseTitle", property.name || property.title || "");
    router.push(`/chat?${query.toString()}`);
  };

  return (
    <div className="flex min-h-[calc(100vh-60px)] flex-col bg-white pb-[90px]">
      <div className="group relative h-[420px] w-full overflow-hidden">
        <div
          ref={carouselRef}
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex h-full w-full snap-x snap-mandatory overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {images.map((image, index) => (
            <div key={index} onClick={() => openFullScreen(index)} className="h-full w-full flex-shrink-0 snap-center cursor-pointer">
              <SafeImage src={image} alt={`${title} ${index + 1}`} className="h-full w-full object-cover" draggable={false} fallbackSrc="/images/defaultimage.jpg" />
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />

        <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between">
          <button
            onClick={(event) => {
              event.stopPropagation();
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push("/");
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-colors hover:bg-white"
          >
            <ChevronLeft size={24} className="pr-0.5 text-gray-800" />
          </button>

          <div className="flex gap-3">
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-colors hover:bg-white">
              <Share2 size={20} className="text-gray-800" />
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                handleToggleFavorite();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-colors hover:bg-white"
            >
              <Heart size={20} className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-800"} />
            </button>
          </div>
        </div>

        {images.length > 1 && activeImageIndex > 0 ? (
          <button
            onClick={(event) => {
              event.stopPropagation();
              scrollToIndex(activeImageIndex - 1);
            }}
            className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-all hover:bg-black/60 group-hover:opacity-100 active:opacity-100"
          >
            <ChevronLeft size={22} />
          </button>
        ) : null}

        {images.length > 1 && activeImageIndex < images.length - 1 ? (
          <button
            onClick={(event) => {
              event.stopPropagation();
              scrollToIndex(activeImageIndex + 1);
            }}
            className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-all hover:bg-black/60 group-hover:opacity-100 active:opacity-100"
          >
            <ChevronRight size={22} />
          </button>
        ) : null}

        <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between">
          <span className={`rounded-lg px-3 py-1.5 text-xs font-bold tracking-wide text-white shadow-sm ${statusColor}`}>
            {statusLabel}
          </span>

          {images.length > 1 ? (
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(event) => {
                      event.stopPropagation();
                      scrollToIndex(index);
                    }}
                    className={`h-2 rounded-full transition-all duration-200 ${
                      index === activeImageIndex ? "w-5 bg-white" : "w-2 bg-white/50 hover:bg-white/75"
                    }`}
                  />
                ))}
              </div>
              <span className="rounded-full bg-black/30 px-2 py-0.5 text-xs font-semibold text-white/90 backdrop-blur-sm">
                {activeImageIndex + 1}/{images.length}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="p-5">
        <div className="mb-2 flex flex-row items-baseline text-blue-600">
          <span className="text-[26px] font-[800]">{formattedPrice}</span>
          <span className="ml-1 text-sm font-medium text-gray-500">{t("property.units.monthAbbr")}</span>
        </div>

        <h1 className="mb-3 text-[22px] font-bold leading-8 text-gray-900">{title}</h1>

        <div className="mb-6 flex items-start gap-1.5 text-gray-500">
          <MapPin size={16} className="mt-1 flex-shrink-0" />
          <span className="flex-1 text-[15px] leading-relaxed">{address}</span>
        </div>

        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold text-gray-800">{t("property.detail.postedBy")}</h3>
          {owner ? (
            <div className="flex flex-wrap gap-2">
              <Link
                href={owner.id === user?.id ? "/profile" : `/user/${owner.id}`}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1.5 transition-colors hover:bg-gray-100"
              >
                {owner.avatarUrl ? (
                  <SafeImage src={owner.avatarUrl} alt={owner.name} className="h-7 w-7 rounded-full object-cover" fallbackSrc="/images/defaultimage.jpg" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700">
                    {getInitials(owner.name)}
                  </div>
                )}
                <span className="text-xs font-medium text-gray-700">{owner.name}</span>
              </Link>
            </div>
          ) : (
            <p className="text-sm text-gray-500">{t("property.detail.noPosterInfo")}</p>
          )}
        </div>

        <div className="mb-6 h-px w-full bg-gray-200" />

        <div className="mb-6 flex flex-row justify-between px-2">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#EEF2F7]">
              <BedDouble size={20} className="text-blue-600" />
            </div>
            <span className="text-[15px] font-bold text-gray-900">{property.bedrooms}</span>
            <span className="text-[13px] text-gray-500">{t("property.fields.bedrooms")}</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#EEF2F7]">
              <Bath size={20} className="text-blue-600" />
            </div>
            <span className="text-[15px] font-bold text-gray-900">{bathroomValue}</span>
            <span className="text-[13px] text-gray-500">{t("property.fields.bathrooms")}</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#EEF2F7]">
              <Square size={20} className="text-blue-600" />
            </div>
            <span className="text-[15px] font-bold text-gray-900">{property.square || 0} m²</span>
            <span className="text-[13px] text-gray-500">{t("property.fields.area")}</span>
          </div>
        </div>

        <div className="mb-6 h-px w-full bg-gray-200" />

        {isRoomMiniApartment ? (
          <>
            <div className="mb-6">
              <h2 className="mb-3 text-lg font-bold text-gray-900">{t("property.detail.roomDetailsTitle")}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">{t("property.form.electricityPriceLabel")}</p>
                  <p className="mt-2 text-base font-bold text-slate-900">
                    {roomDetails?.electricityPrice != null ? formatNumber(roomDetails.electricityPrice) : t("property.detail.notProvided")}
                  </p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">{t("property.form.waterPriceLabel")}</p>
                  <p className="mt-2 text-base font-bold text-slate-900">
                    {roomDetails?.waterPrice != null ? formatNumber(roomDetails.waterPrice) : t("property.detail.notProvided")}
                  </p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">{t("property.form.paymentMethodLabel")}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{paymentMethod}</p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">{t("property.form.otherFeesLabel")}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">
                    {roomDetails?.otherFees || t("property.detail.notProvided")}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6 h-px w-full bg-gray-200" />
          </>
        ) : null}

        <div className="mb-3">
          <h2 className="mb-3 text-lg font-bold text-gray-900">{t("property.fields.description")}</h2>
          <p className="whitespace-pre-wrap text-[15px] leading-[24px] text-gray-600">
            {property.description || t("property.detail.noDescription")}
          </p>
        </div>

        <div className="mt-3 border-t border-gray-200 pt-4">
          <button
            onClick={owner?.id === user?.id ? () => router.push("/profile") : handleContactNow}
            className="mx-auto flex w-full max-w-[220px] items-center justify-center rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-700 active:scale-[0.98]"
          >
            {owner?.id === user?.id ? t("property.detail.manageListing") : t("property.detail.contactNow")}
          </button>
        </div>
      </div>

      {isFullScreen ? (
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/95">
          <button onClick={closeFullScreen} className="absolute right-5 top-8 z-50 rounded-full bg-white/20 p-2 transition-colors hover:bg-white/30">
            <X size={24} className="text-white" />
          </button>

          <div
            ref={fullscreenCarouselRef}
            onScroll={handleFullScreenScroll}
            className="relative flex h-[80%] w-full snap-x snap-mandatory overflow-x-auto hide-scrollbar"
          >
            {images.map((image, index) => (
              <div
                key={index}
                onClick={closeFullScreen}
                className="flex h-full w-full flex-shrink-0 snap-center cursor-pointer items-center justify-center p-2"
              >
                <SafeImage src={image} alt={`${title} ${index + 1}`} className="max-h-full max-w-full object-contain" fallbackSrc="/images/defaultimage.jpg" />
              </div>
            ))}
          </div>

          {images.length > 1 ? (
            <div className="pointer-events-none absolute bottom-10 left-0 right-0 flex justify-center gap-2">
              {images.map((_, index) => (
                <div key={index} className={`h-1.5 rounded-full transition-all ${index === fullScreenIndex ? "w-3.5 bg-white" : "w-1.5 bg-white/50"}`} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
