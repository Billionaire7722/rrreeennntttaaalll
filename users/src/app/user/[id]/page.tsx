"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, MapPin, BedDouble, Bath, Square, MessageCircle, Heart } from "lucide-react";
import api from "@/api/axios";
import SafeImage from "@/components/SafeImage";
import { useAuth } from "@/context/useAuth";
import { useLanguage } from "@/context/LanguageContext";
import { getPropertyStatusTranslationKey, getPropertyTypeTranslationKey } from "@/i18n";

function getInitials(name: string): string {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

interface PublicHouse {
  id: string;
  name: string;
  property_type?: string;
  status?: string;
  address?: string;
  district?: string;
  city: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  is_private_bathroom?: boolean;
  square?: number;
  image_url_1?: string;
}

interface PublicUserProfile {
  name: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  bio?: string | null;
  ownedHouses?: PublicHouse[];
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { t, formatNumber } = useLanguage();
  const targetUserId = params.id as string;
  const [userProfile, setUserProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetUserId) return;

    const fetchUserProfile = async () => {
      try {
        const response = await api.get(`/users/public/${targetUserId}`);
        setUserProfile(response.data);
      } catch (error) {
        console.error("Failed to fetch user profile", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [targetUserId]);

  const handleMessageUser = () => {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    if (currentUser.id === targetUserId) {
      window.alert(t("user.selfMessageError"));
      return;
    }

    const queryParams = new URLSearchParams({ recipientId: targetUserId });
    router.push(`/chat?${queryParams.toString()}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <span className="font-medium text-gray-500">{t("common.loading")}</span>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <span className="mb-4 text-center font-medium text-gray-500">{t("user.notFoundDescription")}</span>
        <button
          onClick={() => router.back()}
          className="rounded-xl bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          {t("common.goBack")}
        </button>
      </div>
    );
  }

  const { name, avatarUrl, coverUrl, bio, ownedHouses } = userProfile;
  const hasHouses = Array.isArray(ownedHouses) && ownedHouses.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-20 flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
        <button onClick={() => router.back()} className="rounded-full p-2 transition-colors hover:bg-gray-100">
          <ChevronLeft size={24} className="text-gray-800" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">{t("user.profileTitle")}</h1>
      </div>

      <div className="relative h-44 w-full overflow-hidden bg-gray-100">
        <SafeImage
          src={coverUrl || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80"}
          alt={name}
          className="h-full w-full object-cover"
          fallbackSrc="/images/defaultimage.jpg"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/50" />
      </div>

      <div className="relative flex flex-col items-center border-b border-gray-100 bg-white px-5 pb-8 shadow-sm">
        <div className="relative z-10 -mt-12 mb-3">
          {avatarUrl ? (
            <SafeImage src={avatarUrl} alt={name} className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-md" fallbackSrc="/images/defaultimage.jpg" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-blue-100 text-3xl font-bold text-blue-700 shadow-md">
              {getInitials(name)}
            </div>
          )}
        </div>

        <h2 className="mb-1 text-2xl font-bold text-gray-900">{name}</h2>

        {bio ? <p className="mt-2 max-w-[300px] text-center text-sm leading-relaxed text-gray-600">{bio}</p> : null}

        <button
          onClick={handleMessageUser}
          className="mt-6 flex items-center gap-2 rounded-full bg-blue-600 px-8 py-2.5 font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
        >
          <MessageCircle size={18} />
          {t("user.messageUser")}
        </button>
      </div>

      <div className="px-5 pb-3 pt-8">
        <h3 className="text-lg font-bold text-gray-900">
          {t("user.propertiesByName", { name: name.split(" ")[0] || name })}
          <span className="ml-2 text-sm font-normal text-gray-500">({ownedHouses?.length || 0})</span>
        </h3>
      </div>

      <div className="space-y-4 px-4">
        {hasHouses ? (
          ownedHouses.map((house) => {
            const statusKey = getPropertyStatusTranslationKey(house.status);
            const typeKey = getPropertyTypeTranslationKey(house.property_type);
            const statusLabel = statusKey ? t(statusKey) : house.status;
            const title = typeKey ? t(typeKey) : house.property_type || house.name;
            const address = house.address || `${house.district ? `${house.district}, ` : ""}${house.city}`;
            const isAvailable = house.status?.toLowerCase() === "available";

            return (
              <div
                key={house.id}
                onClick={() => router.push(`/properties/${house.id}`)}
                className="cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative h-48 w-full bg-gray-100">
                  <SafeImage
                    src={house.image_url_1 || "/images/defaultimage.jpg"}
                    alt={title}
                    className="h-full w-full object-cover"
                    fallbackSrc="/images/defaultimage.jpg"
                  />
                  <div className={`absolute left-3 top-3 rounded-md px-2.5 py-1 text-xs font-bold text-white shadow-sm ${isAvailable ? "bg-emerald-500" : "bg-red-500"}`}>
                    {statusLabel}
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-1 flex items-start justify-between">
                    <h4 className="line-clamp-1 flex-1 pr-2 text-[17px] font-bold text-gray-900">{title}</h4>
                    <span className="whitespace-nowrap font-bold text-blue-600">
                      {formatNumber(house.price || 0)} VND
                    </span>
                  </div>

                  <div className="mb-3 flex items-center gap-1.5 text-gray-500">
                    <MapPin size={14} className="flex-shrink-0" />
                    <span className="line-clamp-1 text-sm">{address}</span>
                  </div>

                  <div className="flex items-center gap-4 border-t border-gray-100 pt-3 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <BedDouble size={16} className="text-gray-400" />
                      <span className="text-[13px] font-medium">{house.bedrooms}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Bath size={16} className="text-gray-400" />
                      <span className="text-[13px] font-medium">
                        {house.is_private_bathroom ? t("property.fields.privateBath") : house.bathrooms || 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Square size={16} className="text-gray-400" />
                      <span className="text-[13px] font-medium">{house.square || 0} m²</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <Heart size={24} className="text-blue-300" />
            </div>
            <h4 className="mb-1 font-bold text-gray-900">{t("user.noPropertiesTitle")}</h4>
            <p className="text-sm text-gray-500">{t("user.noPropertiesDescription")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
