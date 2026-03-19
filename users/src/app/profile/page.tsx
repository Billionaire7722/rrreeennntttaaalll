"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Bed,
  Building2,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Globe,
  Heart,
  HelpCircle,
  Info,
  MapPin,
  Menu,
  MessageCircle,
  Pencil,
  Square,
  Settings,
  Trash2,
  UserCog,
  X,
} from "lucide-react";
import api from "@/api/axios";
import EditPropertyModal from "@/components/EditPropertyModal";
import PropertyCard, { Property } from "@/components/PropertyCard";
import SafeImage from "@/components/SafeImage";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/context/useAuth";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { LOCALE_METADATA, SUPPORTED_LOCALES, type Locale } from "@/i18n";
import { SAFE_IMAGE_ACCEPT, isSafeImageFile } from "@/utils/safeMedia";
import AvatarCropModal from "./components/AvatarCropModal";
import EditProfileForm from "./components/EditProfileForm";
import ProfileAbout from "./components/ProfileAbout";
import ProfileHeader from "./components/ProfileHeader";
import ProfileStats from "./components/ProfileStats";

type ProfileTabKey = "favorites" | "my-properties" | "messages";

const PROFILE_TAB_STORAGE_KEY = "profile-active-tab";
const PAGE_SIZE = 10;

interface Conversation {
  otherUser: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  lastMessage: {
    senderId: string;
    content: string;
    created_at: string;
  };
  unreadCount: number;
}

interface FavoriteApiItem {
  house: {
    id: string;
    name: string;
    property_type?: string;
    ward?: string;
    district?: string;
    city: string;
    price?: number;
    bedrooms?: number;
    square?: number;
    status?: string;
    image_url_1?: string;
    image_url_2?: string;
  };
}

interface MyHouse {
  id: string;
  name: string;
  property_type?: string;
  address: string;
  ward?: string;
  district: string;
  city: string;
  price?: number;
  square?: number;
  bedrooms?: number;
  description?: string;
  contact_phone?: string;
  image_url_1?: string;
  image_url_2?: string;
  image_url_3?: string;
  image_url_4?: string;
  image_url_5?: string;
  image_url_6?: string;
  image_url_7?: string;
  video_url_1?: string;
  video_url_2?: string;
  status?: string;
  created_at: string;
  roomDetails?: {
    electricityPrice?: number | null;
    waterPrice?: number | null;
    paymentMethod?: string | null;
    otherFees?: string | null;
  } | null;
}

interface ApiErrorShape {
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: string | { message?: string | string[] };
    };
  };
}

type FeedbackMessage = {
  type: "success" | "error" | "";
  text: string;
};

type UploadTarget = "avatar" | "cover";
type HouseStatus = "available" | "rented" | "pending";

interface UploadResponseShape {
  url?: string;
}

interface UploadedProfileShape {
  avatarUrl?: string | null;
  coverUrl?: string | null;
}

interface AvatarDraft {
  previewUrl: string;
}

function getInitials(name: string) {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function toPropertyCard(item: {
  id: string;
  name: string;
  property_type?: string;
  address: string;
  city: string;
  price?: number;
  bedrooms?: number;
  square?: number;
  status?: string;
  image_url?: string;
}) {
  return {
    id: item.id,
    title: item.name,
    property_type: item.property_type,
    price: item.price || 0,
    address: item.address,
    city: item.city,
    bedrooms: item.bedrooms || 0,
    bathrooms: 1,
    hasPrivateBathroom: false,
    area: item.square || 0,
    image_url: item.image_url || "/images/defaultimage.jpg",
    status: item.status || "AVAILABLE",
  } satisfies Property;
}

function normalizeHouseStatus(status?: string | null): HouseStatus {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "rented") return "rented";
  if (normalized === "pending") return "pending";
  return "available";
}

function getApiErrorMessage(error: unknown) {
  const apiError = error as ApiErrorShape;
  const responseData = apiError.response?.data;

  if (typeof responseData?.message === "string" && responseData.message.trim()) {
    return responseData.message;
  }

  if (typeof responseData?.error === "string" && responseData.error.trim()) {
    return responseData.error;
  }

  const nestedMessage = responseData?.error && typeof responseData.error === "object" ? responseData.error.message : undefined;
  if (typeof nestedMessage === "string" && nestedMessage.trim()) {
    return nestedMessage;
  }

  if (Array.isArray(nestedMessage) && nestedMessage.length > 0) {
    return nestedMessage.join(". ");
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return undefined;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { t, language, localeTag, setLanguage, formatDate, formatNumber, formatTime } = useLanguage();
  const { resolvedTheme } = useTheme();
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [myHouses, setMyHouses] = useState<MyHouse[]>([]);
  const [loadingFavs, setLoadingFavs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMyHouses, setLoadingMyHouses] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTabKey>("favorites");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState({ type: "", text: "" });
  const [feedbackMessage, setFeedbackMessage] = useState<FeedbackMessage>({ type: "", text: "" });
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState<AvatarDraft | null>(null);
  const [updatingHouseStatusIds, setUpdatingHouseStatusIds] = useState<Record<string, boolean>>({});
  const [editingHouse, setEditingHouse] = useState<MyHouse | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLangExpanded, setIsLangExpanded] = useState(false);
  const [visibleCounts, setVisibleCounts] = useState<Record<ProfileTabKey, number>>({
    favorites: PAGE_SIZE,
    "my-properties": PAGE_SIZE,
    messages: PAGE_SIZE,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const languageOptions = SUPPORTED_LOCALES.map((locale) => ({ key: locale, ...LOCALE_METADATA[locale] }));
  const unreadChatCount = useMemo(() => conversations.reduce((sum, item) => sum + (item.unreadCount || 0), 0), [conversations]);
  const tabs = [
    { key: "favorites" as const, label: t("navigation.saved"), count: favorites.length, icon: Heart },
    { key: "my-properties" as const, label: t("navigation.myProperties"), count: myHouses.length, icon: Building2 },
    { key: "messages" as const, label: t("navigation.chats"), count: unreadChatCount, icon: MessageCircle },
  ];
  const visibleFavorites = favorites.slice(0, visibleCounts.favorites);
  const visibleMyProperties = myHouses.slice(0, visibleCounts["my-properties"]);
  const visibleMessages = conversations.slice(0, visibleCounts.messages);

  const showFeedbackMessage = useCallback((type: FeedbackMessage["type"], text: string) => {
    setFeedbackMessage({ type, text });
  }, []);

  const formatConversationTime = useCallback(
    (value?: string) => {
      if (!value) return "";
      const date = new Date(value);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
      if (diffDays === 0) return formatTime(date);
      if (diffDays < 7) return new Intl.DateTimeFormat(localeTag, { weekday: "short" }).format(date);
      return formatDate(date, { day: "2-digit", month: "2-digit" });
    },
    [formatDate, formatTime, localeTag]
  );

  const fetchFavorites = useCallback(async () => {
    setLoadingFavs(true);
    try {
      const response = await api.get("/users/favorites");
      const payload = response.data as FavoriteApiItem[];
      setFavorites(
        payload.map((favorite) =>
          toPropertyCard({
            id: favorite.house.id,
            name: favorite.house.name,
            property_type: favorite.house.property_type,
            address: favorite.house.ward || favorite.house.district || "",
            city: favorite.house.city,
            price: favorite.house.price,
            bedrooms: favorite.house.bedrooms,
            square: favorite.house.square,
            status: favorite.house.status,
            image_url: favorite.house.image_url_1 || favorite.house.image_url_2 || "/images/defaultimage.jpg",
          })
        )
      );
    } catch {
      setFavorites([]);
    } finally {
      setLoadingFavs(false);
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoadingMessages(true);
    try {
      const response = await api.get("/users/conversations");
      setConversations((response.data || []) as Conversation[]);
    } catch {
      setConversations([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [user]);

  const fetchMyHouses = useCallback(async () => {
    setLoadingMyHouses(true);
    try {
      const response = await api.get("/houses/me");
      setMyHouses((response.data?.data || []) as MyHouse[]);
    } catch {
      setMyHouses([]);
    } finally {
      setLoadingMyHouses(false);
    }
  }, []);

  const handleDeleteHouse = async (houseId: string) => {
    if (!window.confirm(t("property.messages.deleteConfirm"))) return;

    try {
      await api.delete(`/houses/${houseId}`);
      setMyHouses((previous) => previous.filter((house) => house.id !== houseId));
    } catch {
      window.alert(t("property.messages.deleteFailed"));
    }
  };

  useEffect(() => {
    const savedTab = localStorage.getItem(PROFILE_TAB_STORAGE_KEY) as ProfileTabKey | null;
    if (savedTab === "favorites" || savedTab === "my-properties" || savedTab === "messages") {
      setActiveTab(savedTab);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(PROFILE_TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!feedbackMessage.text) return;

    const timer = window.setTimeout(() => {
      setFeedbackMessage({ type: "", text: "" });
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [feedbackMessage]);

  useEffect(() => {
    return () => {
      if (avatarDraft?.previewUrl) {
        URL.revokeObjectURL(avatarDraft.previewUrl);
      }
    };
  }, [avatarDraft?.previewUrl]);

  useEffect(() => {
    if (authLoading || !user) return;

    fetchFavorites();
    fetchMyHouses();
    fetchConversations();

    api
      .get("/users/profile")
      .then((response) => {
        if (response.data.avatarUrl) {
          setAvatarUrl(response.data.avatarUrl);
          localStorage.setItem(`avatar_${user.id}`, response.data.avatarUrl);
        }

        if (response.data.coverUrl) {
          setCoverUrl(response.data.coverUrl);
          localStorage.setItem(`cover_${user.id}`, response.data.coverUrl);
        }

        setEditFirstName(response.data.firstName || "");
        setEditLastName(response.data.lastName || "");
        setEditBio(response.data.bio || "");
      })
      .catch(() => {
        const savedAvatar = localStorage.getItem(`avatar_${user.id}`);
        const savedCover = localStorage.getItem(`cover_${user.id}`);
        if (savedAvatar) setAvatarUrl(savedAvatar);
        if (savedCover) setCoverUrl(savedCover);
      });
  }, [authLoading, fetchConversations, fetchFavorites, fetchMyHouses, user]);

  useEffect(() => {
    setVisibleCounts((previous) => ({
      favorites: Math.min(Math.max(previous.favorites, PAGE_SIZE), Math.max(favorites.length, PAGE_SIZE)),
      "my-properties": Math.min(Math.max(previous["my-properties"], PAGE_SIZE), Math.max(myHouses.length, PAGE_SIZE)),
      messages: Math.min(Math.max(previous.messages, PAGE_SIZE), Math.max(conversations.length, PAGE_SIZE)),
    }));
  }, [conversations.length, favorites.length, myHouses.length]);

  const handleRemoveFavorite = async (propertyId: string) => {
    try {
      await api.post("/users/favorites/toggle", { houseId: propertyId });
      setFavorites((previous) => previous.filter((item) => item.id !== propertyId));
    } catch {}
  };

  const handleHouseStatusChange = async (house: MyHouse, nextStatus: Exclude<HouseStatus, "pending">) => {
    if (updatingHouseStatusIds[house.id]) return;

    const currentStatus = normalizeHouseStatus(house.status);
    if (currentStatus === nextStatus) return;

    const nextStatusLabel = t(`property.status.${nextStatus}`);
    const confirmationMessage = `Set "${house.name}" as ${nextStatusLabel.toLowerCase()}?`;

    if (!window.confirm(confirmationMessage)) return;

    const previousStatus = house.status || "AVAILABLE";

    setUpdatingHouseStatusIds((previous) => ({ ...previous, [house.id]: true }));
    setMyHouses((previous) =>
      previous.map((item) =>
        item.id === house.id
          ? {
              ...item,
              status: nextStatus,
            }
          : item
      )
    );

    try {
      const response = await api.patch(`/houses/${house.id}/status`, { status: nextStatus });
      const savedStatus = response.data?.status || nextStatus;

      setMyHouses((previous) =>
        previous.map((item) =>
          item.id === house.id
            ? {
                ...item,
                status: savedStatus,
              }
            : item
        )
      );

      showFeedbackMessage("success", `"${house.name}" is now ${nextStatusLabel}.`);
    } catch (error) {
      setMyHouses((previous) =>
        previous.map((item) =>
          item.id === house.id
            ? {
                ...item,
                status: previousStatus,
              }
            : item
        )
      );

      showFeedbackMessage("error", getApiErrorMessage(error) || `Couldn't update "${house.name}".`);
    } finally {
      setUpdatingHouseStatusIds((previous) => {
        const next = { ...previous };
        delete next[house.id];
        return next;
      });
    }
  };

  const uploadAndSaveProfileImage = useCallback(async (file: Blob | File, target: UploadTarget) => {
    const uploadFile =
      file instanceof File
        ? file
        : new File([file], `${target}.jpg`, {
            type: file.type || "image/jpeg",
          });

    const formData = new FormData();
    formData.append("file", uploadFile);

    const uploadResponse = await api.post<UploadResponseShape>("/upload/image", formData);
    if (!uploadResponse.data?.url) {
      throw new Error("Upload did not return a Cloudinary URL.");
    }

    const saveResponse = await api.post<UploadedProfileShape>(`/users/${target}`, { url: uploadResponse.data.url });
    return {
      url: uploadResponse.data.url,
      savedProfile: saveResponse.data,
    };
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!isSafeImageFile(file)) {
      showFeedbackMessage("error", t("property.form.invalidImageType"));
      return;
    }

    setFeedbackMessage({ type: "", text: "" });
    setAvatarDraft({ previewUrl: URL.createObjectURL(file) });
  };

  const handleAvatarUpload = async (blob: Blob) => {
    if (!user) return;

    setIsUploading(true);
    setFeedbackMessage({ type: "", text: "" });

    try {
      const { url, savedProfile } = await uploadAndSaveProfileImage(blob, "avatar");
      const nextAvatarUrl = savedProfile.avatarUrl || url;

      setAvatarUrl(nextAvatarUrl);
      localStorage.setItem(`avatar_${user.id}`, nextAvatarUrl);
      setAvatarDraft(null);
      showFeedbackMessage("success", t("profile.messages.profileUpdated"));
    } catch (error) {
      showFeedbackMessage("error", getApiErrorMessage(error) || t("profile.uploadAvatarError"));
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleCoverFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !user) return;

    if (!isSafeImageFile(file)) {
      showFeedbackMessage("error", t("property.form.invalidImageType"));
      return;
    }

    setIsUploadingCover(true);
    setFeedbackMessage({ type: "", text: "" });
    try {
      const { url, savedProfile } = await uploadAndSaveProfileImage(file, "cover");
      const nextCoverUrl = savedProfile.coverUrl || url;
      setCoverUrl(nextCoverUrl);
      localStorage.setItem(`cover_${user.id}`, nextCoverUrl);
      showFeedbackMessage("success", t("profile.messages.profileUpdated"));
    } catch (error) {
      showFeedbackMessage("error", getApiErrorMessage(error) || t("profile.uploadCoverError"));
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSaveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingSettings(true);
    setSettingsMessage({ type: "", text: "" });

    try {
      await api.post("/users/profile", { firstName: editFirstName, lastName: editLastName, bio: editBio });
      setSettingsMessage({ type: "success", text: t("profile.messages.profileUpdated") });
      setIsEditingProfile(false);
      setTimeout(() => setSettingsMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      const errorMessage = getApiErrorMessage(error);
      const apiError = error as ApiErrorShape;
      setSettingsMessage({
        type: "error",
        text:
          apiError.response?.status === 403
            ? errorMessage || t("profile.messages.nameChangeLimit")
            : errorMessage || t("profile.messages.editFailed"),
      });
    } finally {
      setSavingSettings(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-[calc(100vh-60px)] bg-slate-950 px-4 py-12" />;
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-60px)] bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.18),transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-4 py-12">
        <div className="mx-auto max-w-sm rounded-[2rem] border border-white/80 bg-white/85 p-8 text-center shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur">
          <h2 className="text-2xl font-black text-slate-900">{t("profile.welcomeTitle")}</h2>
          <div className="mt-8 space-y-3">
            <Link href="/login" className="flex w-full items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-base font-semibold text-white">
              {t("auth.shared.signInButton")}
            </Link>
            <Link href="/register" className="flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3 text-base font-semibold text-slate-700">
              {t("auth.register.createAccountButton")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-[calc(100vh-60px)] ${
        resolvedTheme === "dark"
          ? "bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.18),transparent_24%),linear-gradient(180deg,#020617_0%,#06111f_22%,#020617_100%)]"
          : "bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.20),transparent_24%),linear-gradient(180deg,#eff6ff_0%,#f8fafc_24%,#f8fafc_100%)]"
      }`}
      style={{ paddingBottom: "calc(9rem + env(safe-area-inset-bottom))" }}
    >
      <section className="relative overflow-hidden">
        <SafeImage
          src={coverUrl || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"}
          alt={user.name || t("navigation.profile")}
          className={`h-[240px] w-full object-cover opacity-45 sm:h-[280px] lg:h-[320px] ${isUploadingCover ? "opacity-30" : ""}`}
          fallbackSrc="/images/defaultimage.jpg"
        />
        <div className="absolute left-0 right-0 top-0 z-10 mx-auto flex max-w-6xl items-start justify-between px-4 pt-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => coverInputRef.current?.click()} disabled={isUploadingCover} className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur disabled:cursor-not-allowed disabled:opacity-60">
            <Camera className="h-4 w-4" />
            {isUploadingCover ? t("common.loading") : t("profile.editCover")}
          </button>
          <button type="button" onClick={() => setIsDrawerOpen(true)} className="rounded-full border border-white/20 bg-black/20 p-3 text-white backdrop-blur" aria-label={t("navigation.settings")}>
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <input type="file" accept={SAFE_IMAGE_ACCEPT} ref={coverInputRef} className="hidden" onChange={handleCoverFileChange} />
      </section>

      <div className="mx-auto -mt-20 max-w-6xl px-4 sm:-mt-24 sm:px-6 lg:px-8">
        <ProfileHeader user={user} avatarUrl={avatarUrl} coverUrl={coverUrl} isUploading={isUploading} onAvatarClick={() => fileInputRef.current?.click()} onEditToggle={() => setIsEditingProfile(true)} t={t} />
        <input type="file" accept={SAFE_IMAGE_ACCEPT} ref={fileInputRef} className="hidden" onChange={handleFileChange} />

        {feedbackMessage.text ? <StatusMessage message={feedbackMessage} /> : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-6">
            {isEditingProfile ? (
              <EditProfileForm firstName={editFirstName} lastName={editLastName} bio={editBio} setFirstName={setEditFirstName} setLastName={setEditLastName} setBio={setEditBio} onSave={handleSaveSettings} onCancel={() => setIsEditingProfile(false)} isSaving={savingSettings} message={settingsMessage} t={t} />
            ) : (
              <>
                <ProfileAbout bio={editBio} t={t} />
                <ProfileStats favoritesCount={favorites.length} listingsCount={myHouses.length} chatsCount={conversations.length} t={t} />
              </>
            )}
          </div>

          <div className="space-y-4">
            <section className="rounded-[1.75rem] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--theme-text-muted)]">{t("profile.sectionsTitle")}</p>
              <p className="mt-1 text-sm font-semibold text-[var(--theme-text)]">{t("profile.sectionsDescription")}</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`rounded-2xl px-3 py-3 text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-teal-600)] ${
                      activeTab === tab.key
                        ? "bg-[var(--color-teal-600)] text-white shadow-lg shadow-black/10 hover:brightness-95 active:brightness-90"
                        : "bg-[var(--theme-surface-2)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface)]"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <p className="mt-3 text-sm font-semibold">{tab.label}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-6">
              {activeTab === "favorites" ? (
                <div className="space-y-4">
                  <SectionHeader title={t("profile.savedSectionTitle")} description={t("profile.savedSectionDescription")} />
                  {loadingFavs ? <SectionLoading /> : null}
                  {!loadingFavs && favorites.length === 0 ? <EmptyState icon={<Heart className="h-6 w-6" />} title={t("profile.savedEmptyTitle")} description={t("profile.savedSectionDescription")} /> : null}
                  {!loadingFavs && favorites.length > 0 ? (
                    <>
                      <div className="grid gap-4 lg:grid-cols-2">
                        {visibleFavorites.map((property) => (
                          <PropertyCard key={property.id} property={property} onToggleFavorite={handleRemoveFavorite} isFavorite />
                        ))}
                      </div>
                      <LoadMoreControl shown={visibleFavorites.length} total={favorites.length} onClick={() => setVisibleCounts((previous) => ({ ...previous, favorites: previous.favorites + PAGE_SIZE }))} label={t("common.loadMore")} />
                    </>
                  ) : null}
                </div>
              ) : null}

              {activeTab === "my-properties" ? (
                <div className="space-y-4">
                  <SectionHeader title={t("profile.myPropertiesTitle")} description={t("profile.myPropertiesSectionDescription")} />
                  {loadingMyHouses ? <SectionLoading /> : null}
                  {!loadingMyHouses && myHouses.length === 0 ? <EmptyState icon={<Building2 className="h-6 w-6" />} title={t("profile.myPropertiesEmptyTitle")} description={t("profile.myPropertiesSectionDescription")} /> : null}
                  {!loadingMyHouses && myHouses.length > 0 ? (
                    <>
                      <div className="space-y-3">
                        {visibleMyProperties.map((house) => {
                          const status = normalizeHouseStatus(house.status);
                          const locationText = [house.address, house.ward || house.district, house.city].filter(Boolean).join(", ");
                          const imageSrc = house.image_url_1 || house.image_url_2 || "/images/defaultimage.jpg";
                          const priceText = house.price ? `${formatNumber(house.price)} VND${t("property.units.monthAbbr")}` : t("property.detail.notProvided");
                          const statusClass =
                            status === "available"
                              ? "bg-emerald-100 text-emerald-700"
                              : status === "pending"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-rose-100 text-rose-700";

                          return (
                            <div key={house.id} className="rounded-[1.5rem] border border-[var(--theme-border)] bg-[var(--theme-surface-2)] p-3 sm:p-4">
                              <div className="flex items-start gap-3">
                                <Link href={`/properties/${house.id}`} className="h-20 w-24 flex-shrink-0 overflow-hidden rounded-[1rem] bg-slate-200 sm:h-24 sm:w-28">
                                  <SafeImage src={imageSrc} alt={house.name} className="h-full w-full object-cover" fallbackSrc="/images/defaultimage.jpg" />
                                </Link>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <Link href={`/properties/${house.id}`} className="line-clamp-2 text-sm font-bold text-[var(--theme-text)] transition-colors hover:text-[var(--color-teal-600)] sm:text-base">
                                        {house.name}
                                      </Link>
                                      <p className="mt-1 flex items-start gap-1 text-xs text-[var(--theme-text-muted)]">
                                        <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                                        <span className="line-clamp-2">{locationText}</span>
                                      </p>
                                    </div>
                                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${statusClass}`}>
                                      {t(`property.status.${status}`)}
                                    </span>
                                  </div>

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--color-teal-700)]">
                                      {priceText}
                                    </span>
                                    {house.bedrooms != null ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[var(--theme-text-muted)]">
                                        <Bed className="h-3.5 w-3.5 text-[var(--color-teal-600)]" />
                                        {house.bedrooms} {t("property.fields.bedrooms")}
                                      </span>
                                    ) : null}
                                    {house.square != null ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[var(--theme-text-muted)]">
                                        <Square className="h-3.5 w-3.5 text-[var(--color-teal-600)]" />
                                        {house.square} m²
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 flex flex-col gap-3 border-t border-[var(--theme-border)] pt-3 lg:flex-row lg:items-center lg:justify-between">
                                <p className="text-xs text-[var(--theme-text-muted)]">
                                  {t("profile.createdOn", {
                                    date: formatDate(house.created_at, { day: "2-digit", month: "2-digit", year: "numeric" }),
                                  })}
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingHouse(house)}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--theme-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--theme-text)] transition-colors hover:border-[var(--color-teal-300)] hover:text-[var(--color-teal-700)]"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                    {t("common.edit")}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteHouse(house.id)}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    {t("common.delete")}
                                  </button>
                                  <HouseStatusToggle
                                    currentStatus={status}
                                    isUpdating={Boolean(updatingHouseStatusIds[house.id])}
                                    onChange={(nextStatus) => handleHouseStatusChange(house, nextStatus)}
                                    t={t}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <LoadMoreControl shown={visibleMyProperties.length} total={myHouses.length} onClick={() => setVisibleCounts((previous) => ({ ...previous, "my-properties": previous["my-properties"] + PAGE_SIZE }))} label={t("common.loadMore")} />
                    </>
                  ) : null}
                </div>
              ) : null}

              {activeTab === "messages" ? (
                <div className="space-y-4">
                  <SectionHeader title={t("chat.conversationsTitle")} description={t("chat.emptyDescription")} />
                  {loadingMessages ? <SectionLoading /> : null}
                  {!loadingMessages && conversations.length === 0 ? <EmptyState icon={<MessageCircle className="h-6 w-6" />} title={t("chat.emptyTitle")} description={t("chat.emptyDescription")} /> : null}
                  {!loadingMessages && conversations.length > 0 ? (
                    <>
                      <div className="space-y-3">
                        {visibleMessages.map((conversation) => {
                          const query = new URLSearchParams({ recipientId: conversation.otherUser.id }).toString();
                          return (
                            <Link key={conversation.otherUser.id} href={`/chat?${query}`} className={`flex items-start gap-3 rounded-[1.5rem] border p-4 sm:items-center sm:gap-4 ${conversation.unreadCount > 0 ? "border-emerald-200 bg-emerald-50/60" : "border-[var(--theme-border)] bg-[var(--theme-surface)]"}`}>
                              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-slate-900 via-teal-700 to-emerald-400 text-lg font-black text-white">
                                {conversation.otherUser.avatarUrl ? (
                                  <SafeImage src={conversation.otherUser.avatarUrl} alt={conversation.otherUser.name} className="h-full w-full object-cover" fallbackSrc="/images/defaultimage.jpg" />
                                ) : (
                                  getInitials(conversation.otherUser.name)
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="min-w-0">
                                    <p className="truncate font-bold text-[var(--theme-text)]">{conversation.otherUser.name}</p>
                                    <p className="truncate text-sm text-[var(--theme-text-muted)]">
                                      {conversation.lastMessage.senderId === user.id ? t("chat.youPrefix") : ""}
                                      {conversation.lastMessage.content}
                                    </p>
                                  </div>
                                  <div className="flex flex-shrink-0 items-center gap-2 self-start text-xs text-[var(--theme-text-muted)]">
                                    <Clock3 className="h-3.5 w-3.5" />
                                    {formatConversationTime(conversation.lastMessage.created_at)}
                                    {conversation.unreadCount > 0 ? (
                                      <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                        {conversation.unreadCount}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="hidden h-4 w-4 flex-shrink-0 text-[var(--theme-text-muted)] sm:block" />
                            </Link>
                          );
                        })}
                      </div>
                      <LoadMoreControl shown={visibleMessages.length} total={conversations.length} onClick={() => setVisibleCounts((previous) => ({ ...previous, messages: previous.messages + PAGE_SIZE }))} label={t("common.loadMore")} />
                    </>
                  ) : null}
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </div>

      {editingHouse ? <EditPropertyModal house={editingHouse} onClose={() => setEditingHouse(null)} onSuccess={() => { setEditingHouse(null); fetchMyHouses(); }} /> : null}
      {avatarDraft ? (
        <AvatarCropModal
          previewUrl={avatarDraft.previewUrl}
          isSubmitting={isUploading}
          onCancel={() => {
            if (!isUploading) {
              setAvatarDraft(null);
            }
          }}
          onConfirm={handleAvatarUpload}
          t={t}
        />
      ) : null}

      {isDrawerOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative z-50 flex h-full w-full max-w-sm flex-col bg-[var(--theme-surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--theme-border)] px-6 py-5">
              <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--theme-text)]">
                <Settings className="h-5 w-5 text-[var(--theme-text-muted)]" />
                {t("navigation.settings")}
              </h2>
              <button type="button" onClick={() => setIsDrawerOpen(false)} className="rounded-full p-2 text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-2)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-2">
                <div className="rounded-[1.25rem] border border-[var(--theme-border)] bg-[var(--theme-surface-2)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--theme-text-muted)]">{t("common.theme")}</p>
                  <div className="mt-3">
                    <ThemeToggle />
                  </div>
                </div>
                <DrawerLink href="/profile/accounts-center" icon={<UserCog className="h-5 w-5" />} label={t("navigation.accountsCenter")} />
                <div className="overflow-hidden rounded-[1.25rem] border border-[var(--theme-border)] bg-[var(--theme-surface-2)]">
                  <button type="button" onClick={() => setIsLangExpanded((value) => !value)} className="flex w-full items-center justify-between px-4 py-4 text-left text-sm font-semibold text-[var(--theme-text)]">
                    <span className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-[var(--theme-text-muted)]" />
                      {t("navigation.appLanguage")}
                    </span>
                    <ChevronRight className={`h-4 w-4 text-[var(--theme-text-muted)] transition-transform ${isLangExpanded ? "rotate-90" : ""}`} />
                  </button>
                  {isLangExpanded ? (
                    <div className="border-t border-[var(--theme-border)] bg-[var(--theme-surface)] py-2">
                      {languageOptions.map((option) => (
                        <button key={option.key} type="button" onClick={() => { setLanguage(option.key as Locale); setIsLangExpanded(false); setIsDrawerOpen(false); }} className={`flex w-full items-center gap-3 px-4 py-3 text-sm ${language === option.key ? "bg-teal-50 font-semibold text-teal-700" : "text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-2)]"}`}>
                          <SafeImage src={option.flagUrl} alt={option.label} className="h-auto w-5 rounded-sm shadow-sm" fallbackSrc="/images/defaultimage.jpg" />
                          <span>{option.nativeLabel}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <DrawerLink href="/profile/help-support" icon={<HelpCircle className="h-5 w-5" />} label={t("navigation.helpSupport")} />
                <DrawerLink href="/about" icon={<Info className="h-5 w-5" />} label={t("navigation.about")} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatusMessage({ message }: { message: FeedbackMessage }) {
  const isSuccess = message.type === "success";

  return (
    <div
      className={`mt-6 flex items-start gap-3 rounded-[1.5rem] border px-4 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50/90 text-emerald-800"
          : "border-rose-200 bg-rose-50/90 text-rose-800"
      }`}
    >
      {isSuccess ? <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" /> : <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />}
      <p className="text-sm font-semibold leading-6">{message.text}</p>
    </div>
  );
}

function HouseStatusToggle({
  currentStatus,
  isUpdating,
  onChange,
  t,
}: {
  currentStatus: HouseStatus;
  isUpdating: boolean;
  onChange: (status: Exclude<HouseStatus, "pending">) => void;
  t: (key: string) => string;
}) {
  const options: Array<Exclude<HouseStatus, "pending">> = ["available", "rented"];
  const selectableStatus = options.includes(currentStatus as Exclude<HouseStatus, "pending">) ? (currentStatus as Exclude<HouseStatus, "pending">) : "available";
  const statusClass =
    currentStatus === "available"
      ? "bg-emerald-100 text-emerald-700"
      : currentStatus === "pending"
        ? "bg-amber-100 text-amber-700"
        : "bg-rose-100 text-rose-700";

  return (
    <div className="flex min-w-[190px] items-center justify-between gap-3 rounded-2xl border border-[var(--theme-border)] bg-white px-3 py-2">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">{t("common.status")}</p>
        <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${statusClass}`}>
          {isUpdating ? t("common.loading") : t(`property.status.${currentStatus}`)}
        </span>
      </div>

      <div className="relative">
        <select
          value={selectableStatus}
          disabled={isUpdating}
          onChange={(event) => {
            const nextStatus = event.target.value as Exclude<HouseStatus, "pending">;
            if (nextStatus !== selectableStatus) {
              onChange(nextStatus);
            }
          }}
          className="min-w-[112px] appearance-none rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2 pr-8 text-xs font-semibold text-[var(--theme-text)] outline-none transition focus:border-[var(--color-teal-400)] focus:ring-2 focus:ring-[var(--color-teal-100)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {options.map((status) => (
            <option key={status} value={status}>
              {t(`property.status.${status}`)}
            </option>
          ))}
        </select>
        <ChevronRight className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-[var(--theme-text-muted)]" />
      </div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b border-[var(--theme-border)] pb-4">
      <h2 className="text-xl font-black text-[var(--theme-text)]">{title}</h2>
      <p className="mt-2 text-sm text-[var(--theme-text-muted)]">{description}</p>
    </div>
  );
}

function SectionLoading() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="h-24 animate-pulse rounded-2xl bg-[var(--theme-surface-2)]" />
      ))}
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-emerald-200 bg-[var(--theme-surface-2)] p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">{icon}</div>
      <h3 className="mt-5 text-lg font-bold text-[var(--theme-text)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--theme-text-muted)]">{description}</p>
    </div>
  );
}

function LoadMoreControl({ shown, total, onClick, label }: { shown: number; total: number; onClick: () => void; label: string }) {
  if (total <= PAGE_SIZE || shown >= total) return null;
  return (
    <div className="flex justify-center pt-2">
      <button type="button" onClick={onClick} className="rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface-2)] px-5 py-2 text-sm font-semibold text-[var(--theme-text)]">
        {label}
      </button>
    </div>
  );
}

function DrawerLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-[1.25rem] border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-4 text-sm font-semibold text-[var(--theme-text)]">
      <span className="flex items-center gap-3">
        <span className="text-[var(--theme-text-muted)]">{icon}</span>
        {label}
      </span>
      <ChevronRight className="h-4 w-4 text-[var(--theme-text-muted)]" />
    </Link>
  );
}
