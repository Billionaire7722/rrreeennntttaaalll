"use client";

export const dynamic = "force-dynamic";

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BedDouble, Building2, Camera, ChevronRight, Clock3, Globe, Heart, HelpCircle, Home, Info, MapPin, Menu, MessageCircle, Pencil, Plus, Settings, Square, Trash2, UserCog, X } from "lucide-react";
import api from "@/api/axios";
import { useAuth } from "@/context/useAuth";
import { Language, useLanguage } from "@/context/LanguageContext";
import EditPropertyModal from "@/components/EditPropertyModal";
import EditProfileForm from "./components/EditProfileForm";
import ProfileAbout from "./components/ProfileAbout";
import ProfileHeader from "./components/ProfileHeader";
import ProfileStats from "./components/ProfileStats";
import SafeImage from "@/components/SafeImage";
import ThemeToggle from "@/components/ThemeToggle";

const FLAGS: Record<Language, { url: string; label: string }> = {
  vi: { url: "https://flagcdn.com/w20/vn.png", label: "Tieng Viet" },
  en: { url: "https://flagcdn.com/w20/gb.png", label: "English" },
  es: { url: "https://flagcdn.com/w20/es.png", label: "Espanol" },
  fr: { url: "https://flagcdn.com/w20/fr.png", label: "Francais" },
  zh: { url: "https://flagcdn.com/w20/cn.png", label: "Chinese" },
  "zh-TW": { url: "https://flagcdn.com/w20/tw.png", label: "Traditional Chinese" },
  ko: { url: "https://flagcdn.com/w20/kr.png", label: "Korean" },
  ja: { url: "https://flagcdn.com/w20/jp.png", label: "Japanese" },
  th: { url: "https://flagcdn.com/w20/th.png", label: "Thai" },
  id: { url: "https://flagcdn.com/w20/id.png", label: "Bahasa Indonesia" },
};

type ProfileTabKey = "favorites" | "my-properties" | "messages";
interface Conversation { otherUser: { id: string; name: string; avatarUrl?: string | null }; lastMessage: { senderId: string; content: string; created_at: string }; unreadCount: number }
interface FavoriteProperty { id: string; title: string; property_type?: string; address: string; city: string; price?: number; bedrooms?: number; area?: number; status?: string; image_url: string }
interface MyHouse { id: string; name: string; property_type?: string; address: string; district: string; city: string; price?: number; square?: number; bedrooms?: number; description?: string; contact_phone?: string; image_url_1?: string; image_url_2?: string; image_url_3?: string; image_url_4?: string; image_url_5?: string; image_url_6?: string; image_url_7?: string; video_url_1?: string; video_url_2?: string; status?: string; created_at: string }
interface FavoriteApiItem { house: { id: string; name: string; property_type?: string; district?: string; city: string; price?: number; bedrooms?: number; square?: number; status?: string; image_url_1?: string; image_url_2?: string } }
interface ApiErrorShape { response?: { status?: number; data?: { message?: string } } }

const getInitials = (name: string) => (name || "").split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("");
const resolvePropertyLabel = (house: { property_type?: string | null; name: string }) => house.property_type || (house.name?.includes(" at ") ? house.name.slice(0, house.name.indexOf(" at ")) : house.name);
const compactPrice = (price?: number) => !price ? "N/A" : price >= 1_000_000 ? `${(price / 1_000_000).toFixed(1)}M VND` : `${price.toLocaleString("vi-VN")} VND`;
const fullPrice = (price?: number) => !price ? "Contact for pricing" : `${price.toLocaleString("vi-VN")} VND`;
const statusTone = (status?: string) => status?.toUpperCase() === "AVAILABLE" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : status?.toUpperCase() === "RENTED" ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200" : status?.toUpperCase() === "PENDING" ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200" : "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
function chatTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  if (diffDays < 7) return date.toLocaleDateString("vi-VN", { weekday: "short" });
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
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
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [editingHouse, setEditingHouse] = useState<MyHouse | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLangExpanded, setIsLangExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const unreadChatCount = useMemo(() => conversations.reduce((acc, item) => acc + (item.unreadCount || 0), 0), [conversations]);
  const tabs = [
    { key: "favorites" as const, label: t("saved"), icon: Heart, count: favorites.length },
    { key: "my-properties" as const, label: t("my_listings"), icon: Building2, count: myHouses.length },
    { key: "messages" as const, label: t("chats"), icon: MessageCircle, count: unreadChatCount },
  ];

  const fetchFavorites = useCallback(async () => {
    setLoadingFavs(true);
    try {
      const res = await api.get("/users/favorites");
      const payload = res.data as FavoriteApiItem[];
      setFavorites(payload.map((fav) => ({ id: fav.house.id, title: resolvePropertyLabel(fav.house), property_type: fav.house.property_type, address: `${fav.house.district ? `${fav.house.district}, ` : ""}${fav.house.city}`, city: fav.house.city, price: fav.house.price, bedrooms: fav.house.bedrooms, area: fav.house.square, status: fav.house.status || "AVAILABLE", image_url: fav.house.image_url_1 || fav.house.image_url_2 || "/images/defaultimage.jpg" })));
    } catch { setFavorites([]); } finally { setLoadingFavs(false); }
  }, []);
  const fetchConversations = useCallback(async () => { if (!user) return; setLoadingMessages(true); try { const res = await api.get("/users/conversations"); setConversations((res.data || []) as Conversation[]); } catch { setConversations([]); } finally { setLoadingMessages(false); } }, [user]);
  const fetchMyHouses = useCallback(async () => { setLoadingMyHouses(true); try { const res = await api.get("/houses/me"); setMyHouses((res.data?.data || []) as MyHouse[]); } catch { setMyHouses([]); } finally { setLoadingMyHouses(false); } }, []);
  const handleDeleteHouse = async (houseId: string) => { if (!confirm("Are you sure you want to delete this property? This cannot be undone.")) return; try { await api.delete(`/houses/${houseId}`); setMyHouses((prev) => prev.filter((house) => house.id !== houseId)); } catch { alert("Failed to delete property."); } };
  const openEdit = () => { setIsEditingProfile(true); setSettingsMessage({ type: "", text: "" }); };

  useEffect(() => {
    if (!authLoading && user) {
      fetchFavorites(); fetchMyHouses(); fetchConversations();
      api.get("/users/profile").then((res) => {
        if (res.data.avatarUrl) { setAvatarUrl(res.data.avatarUrl); localStorage.setItem(`avatar_${user.id}`, res.data.avatarUrl); } else { const saved = localStorage.getItem(`avatar_${user.id}`); if (saved) setAvatarUrl(saved); }
        if (res.data.coverUrl) { setCoverUrl(res.data.coverUrl); localStorage.setItem(`cover_${user.id}`, res.data.coverUrl); } else { const saved = localStorage.getItem(`cover_${user.id}`); if (saved) setCoverUrl(saved); }
        setEditFirstName(res.data.firstName || ""); setEditLastName(res.data.lastName || ""); setEditBio(res.data.bio || "");
      }).catch(() => {
        const savedAvatar = localStorage.getItem(`avatar_${user.id}`); const savedCover = localStorage.getItem(`cover_${user.id}`);
        if (savedAvatar) setAvatarUrl(savedAvatar); if (savedCover) setCoverUrl(savedCover);
      });
    }
  }, [authLoading, fetchConversations, fetchFavorites, fetchMyHouses, user]);
  useEffect(() => { if (user && activeTab === "messages") fetchConversations(); }, [activeTab, fetchConversations, user]);

  const handleRemoveFavorite = async (propertyId: string) => { try { await api.post("/users/favorites/toggle", { houseId: propertyId }); setFavorites((prev) => prev.filter((item) => item.id !== propertyId)); } catch {} };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setIsUploading(true);
    try { const formData = new FormData(); formData.append("file", file); const response = await api.post("/upload/image", formData); if (response.data?.url && user) { setAvatarUrl(response.data.url); localStorage.setItem(`avatar_${user.id}`, response.data.url); try { await api.post("/users/avatar", { url: response.data.url }); } catch (error) { console.error(error); } } } catch (error) { console.error(error); alert("Failed to upload profile picture. Please try again."); } finally { setIsUploading(false); }
  };
  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setIsUploadingCover(true);
    try { const formData = new FormData(); formData.append("file", file); const response = await api.post("/upload/image", formData); if (response.data?.url && user) { setCoverUrl(response.data.url); localStorage.setItem(`cover_${user.id}`, response.data.url); try { await api.post("/users/cover", { url: response.data.url }); } catch (error) { console.error(error); } } } catch (error) { console.error(error); alert("Failed to upload cover image."); } finally { setIsUploadingCover(false); }
  };
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingSettings(true); setSettingsMessage({ type: "", text: "" });
    try { await api.post("/users/profile", { firstName: editFirstName, lastName: editLastName, bio: editBio }); setSettingsMessage({ type: "success", text: "changed successful" }); setIsEditingProfile(false); setTimeout(() => setSettingsMessage({ type: "", text: "" }), 3000); }
    catch (err) { const error = err as ApiErrorShape; setSettingsMessage({ type: "error", text: error.response?.status === 403 ? error.response.data?.message || "You can only change your name once every 30 days." : "Failed to update profile." }); }
    finally { setSavingSettings(false); }
  };

  if (authLoading) return <div className="min-h-[calc(100vh-60px)] bg-slate-950 px-4 py-12"><div className="mx-auto max-w-5xl space-y-4"><div className="h-56 animate-pulse rounded-[2rem] bg-white/10" /><div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]"><div className="h-72 animate-pulse rounded-[2rem] bg-white/10" /><div className="h-96 animate-pulse rounded-[2rem] bg-white/10" /></div></div></div>;
  if (!user) return <div className="min-h-[calc(100vh-60px)] bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.18),transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-4 py-12"><div className="mx-auto max-w-sm rounded-[2rem] border border-white/80 bg-white/85 p-8 text-center shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur"><div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-slate-900 shadow-inner shadow-slate-950/50"><video src="/assets/vid/greenappleHi.mp4" autoPlay loop muted playsInline width={56} height={56} className="object-contain" style={{ mixBlendMode: "screen", transform: "translateZ(0)", WebkitTransform: "translateZ(0)" }} /></div><h2 className="text-2xl font-black text-slate-900">{t("welcome_home")}</h2><p className="mt-3 text-sm leading-6 text-slate-500">{t("profile_welcome_desc")}</p><div className="mt-8 space-y-3"><Link href="/login" className="flex w-full items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-base font-semibold text-white">{t("sign_in_btn")}</Link><Link href="/register" className="flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3 text-base font-semibold text-slate-700">{t("create_account_btn")}</Link></div></div></div>;

  return (
    <div className="min-h-[calc(100vh-60px)] bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.20),transparent_24%),linear-gradient(180deg,#eff6ff_0%,#f8fafc_24%,#f8fafc_100%)]" style={{ paddingBottom: "calc(8.5rem + env(safe-area-inset-bottom))" }}>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.9),rgba(13,148,136,0.72),rgba(255,255,255,0.08))]" />
        <SafeImage src={coverUrl || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"} alt="Profile cover" className={`h-[240px] w-full object-cover opacity-45 sm:h-[280px] lg:h-[320px] ${isUploadingCover ? "opacity-30" : ""}`} fallbackSrc="/images/defaultimage.jpg" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.1),rgba(15,23,42,0.6))]" />
        <div className="absolute left-0 right-0 top-0 z-10 mx-auto flex max-w-6xl items-start justify-between px-4 pt-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => coverInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur"><Camera className="h-4 w-4" />{isUploadingCover ? t("loading") : t("edit_cover")}</button>
          <button type="button" onClick={() => setIsDrawerOpen(true)} className="rounded-full border border-white/20 bg-black/20 p-3 text-white backdrop-blur" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
        </div>
        <input type="file" accept="image/*" ref={coverInputRef} className="hidden" onChange={handleCoverFileChange} />
      </section>

      <div className="mx-auto -mt-20 max-w-6xl px-4 sm:-mt-24 sm:px-6 lg:px-8">
        <ProfileHeader user={user} avatarUrl={avatarUrl} coverUrl={coverUrl} isUploading={isUploading} onAvatarClick={() => fileInputRef.current?.click()} onEditToggle={openEdit} t={t} />
        <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
        <div className="mt-6 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-6">
            {isEditingProfile ? <EditProfileForm firstName={editFirstName} lastName={editLastName} bio={editBio} setFirstName={setEditFirstName} setLastName={setEditLastName} setBio={setEditBio} onSave={handleSaveSettings} onCancel={() => { setIsEditingProfile(false); setSettingsMessage({ type: "", text: "" }); }} isSaving={savingSettings} message={settingsMessage} t={t} /> : <><ProfileAbout bio={editBio} onEdit={openEdit} t={t} /><ProfileStats favoritesCount={favorites.length} listingsCount={myHouses.length} chatsCount={conversations.length} activeTab={activeTab} onTabSelect={setActiveTab} t={t} /></>}
          </div>
          <div className="space-y-4">
            <section className="rounded-[1.75rem] border border-white/70 bg-white/85 p-3 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="grid grid-cols-3 gap-2">{tabs.map((tab) => <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`rounded-[1.25rem] px-3 py-3 text-left transition-all ${activeTab === tab.key ? "bg-slate-900 text-white shadow-lg shadow-slate-900/15" : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`}><div className="flex items-center justify-between gap-2"><tab.icon className="h-4 w-4 flex-shrink-0" />{tab.count > 0 ? <span className={`inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold ${activeTab === tab.key ? "bg-white/15 text-white" : "bg-white text-slate-600"}`}>{tab.count}</span> : null}</div><p className="mt-3 text-sm font-semibold leading-5 sm:text-[15px]">{tab.label}</p></button>)}</div>
            </section>
            <section className="rounded-[2rem] border border-white/70 bg-white/92 p-4 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6">
              {activeTab === "favorites" ? <div className="space-y-5"><SectionHeader eyebrow={t("saved")} title={t("saved_properties") || "Saved properties"} description={t("save_properties_hint") || "Properties you save appear here for quick revisit."} action={favorites.length > 0 ? <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"><Home className="h-4 w-4" />Browse</Link> : undefined} />{loadingFavs ? <div className="grid gap-4 lg:grid-cols-2">{[1, 2, 3, 4].map((item) => <div key={item} className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white"><div className="h-48 animate-pulse bg-slate-100" /><div className="space-y-3 p-5"><div className="h-5 w-2/3 animate-pulse rounded-full bg-slate-100" /><div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-100" /><div className="grid grid-cols-3 gap-2"><div className="h-10 animate-pulse rounded-2xl bg-slate-100" /><div className="h-10 animate-pulse rounded-2xl bg-slate-100" /><div className="h-10 animate-pulse rounded-2xl bg-slate-100" /></div></div></div>)}</div> : favorites.length === 0 ? <PremiumEmptyState icon={<Heart className="h-6 w-6" />} title={t("no_saved_properties") || "No saved properties yet"} description={t("save_properties_hint") || "Tap the heart on any property to build a shortlist you can come back to."} ctaLabel="Browse listings" ctaHref="/" /> : <div className="grid gap-4 lg:grid-cols-2">{favorites.map((property) => <article key={property.id} className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(15,23,42,0.12)]"><Link href={`/properties/${property.id}`} className="block"><div className="relative h-48 overflow-hidden bg-slate-100"><SafeImage src={property.image_url} alt={property.title} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" fallbackSrc="/images/defaultimage.jpg" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 to-transparent px-4 pb-4 pt-10"><div className="flex items-end justify-between gap-3"><span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${statusTone(property.status)}`}>{property.status || "AVAILABLE"}</span><span className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white backdrop-blur">{compactPrice(property.price)}</span></div></div></div></Link><div className="p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link href={`/properties/${property.id}`} className="text-lg font-bold text-slate-900 hover:text-teal-700"><span className="line-clamp-2">{property.property_type || property.title}</span></Link><p className="mt-2 flex items-start gap-2 text-sm text-slate-500"><MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" /><span className="line-clamp-2">{property.address}</span></p></div><button type="button" onClick={() => handleRemoveFavorite(property.id)} className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-100"><Heart className="h-4 w-4 fill-current" /></button></div><div className="mt-4 grid grid-cols-3 gap-2"><MetricPill icon={<BedDouble className="h-3.5 w-3.5" />} label={`${property.bedrooms || 0} BR`} /><MetricPill icon={<Square className="h-3.5 w-3.5" />} label={`${property.area || 0} m2`} /><MetricPill icon={<Building2 className="h-3.5 w-3.5" />} label={property.city || "City"} /></div><div className="mt-4 flex items-center justify-between gap-3"><p className="text-sm font-semibold text-slate-900">{fullPrice(property.price)}</p><Link href={`/properties/${property.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700">View<ChevronRight className="h-4 w-4" /></Link></div></div></article>)}</div>}</div> : null}
              {activeTab === "my-properties" ? <div className="space-y-5"><SectionHeader eyebrow={t("my_listings")} title={t("my_listings_title") || "My listings"} description={t("add_listing_hint") || "Track your active properties, pricing, and next actions in one place."} action={<div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"><Plus className="h-4 w-4" />{t("post_listing_tab")}</div>} />{loadingMyHouses ? <div className="space-y-4">{[1, 2, 3].map((item) => <div key={item} className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white md:flex"><div className="h-56 animate-pulse bg-slate-100 md:w-[280px]" /><div className="flex-1 space-y-4 p-6"><div className="h-6 w-1/2 animate-pulse rounded-full bg-slate-100" /><div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-100" /><div className="grid gap-3 sm:grid-cols-3"><div className="h-20 animate-pulse rounded-[1.25rem] bg-slate-100" /><div className="h-20 animate-pulse rounded-[1.25rem] bg-slate-100" /><div className="h-20 animate-pulse rounded-[1.25rem] bg-slate-100" /></div></div></div>)}</div> : myHouses.length === 0 ? <PremiumEmptyState icon={<Building2 className="h-6 w-6" />} title={t("no_listings_yet") || "No listings yet"} description={t("add_listing_hint") || "Use the floating Post Listing button below to publish your first property."} ctaLabel="Browse the app" ctaHref="/" /> : <div className="space-y-4">{myHouses.map((house) => <article key={house.id} className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.06)]"><div className="flex flex-col md:flex-row"><Link href={`/properties/${house.id}`} className="relative block md:w-[280px] md:flex-shrink-0"><div className="h-56 bg-slate-100 md:h-full"><SafeImage src={house.image_url_1 || house.image_url_2 || "/images/defaultimage.jpg"} alt={house.name} className="h-full w-full object-cover" fallbackSrc="/images/defaultimage.jpg" /></div><div className="absolute left-4 top-4"><span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${statusTone(house.status)}`}>{house.status || "AVAILABLE"}</span></div></Link><div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><Link href={`/properties/${house.id}`} className="text-xl font-bold text-slate-900 hover:text-teal-700"><span className="line-clamp-2">{house.name}</span></Link><p className="mt-2 flex items-start gap-2 text-sm text-slate-500"><MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" /><span className="line-clamp-2">{[house.address, house.district, house.city].filter(Boolean).join(", ")}</span></p></div><div className="rounded-[1.25rem] bg-slate-900 px-4 py-3 text-white"><p className="text-xs uppercase tracking-[0.24em] text-white/60">Price</p><p className="mt-1 text-lg font-black">{compactPrice(house.price)}</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><DashboardMetric title="Type" value={house.property_type || "Property"} /><DashboardMetric title="Area" value={`${house.square || 0} m2`} /><DashboardMetric title="Bedrooms" value={`${house.bedrooms || 0}`} /></div><div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-500">Created {new Date(house.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}</p><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setEditingHouse(house)} className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"><Pencil className="h-4 w-4" />Edit</button><button type="button" onClick={() => handleDeleteHouse(house.id)} className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"><Trash2 className="h-4 w-4" />Delete</button></div></div></div></div></article>)}</div>}</div> : null}
              {activeTab === "messages" ? <div className="space-y-5"><SectionHeader eyebrow={t("chats")} title={t("conversations")} description={t("no_conversations_desc") || "Stay close to inquiries, replies, and renter interest from one inbox."} action={<span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"><MessageCircle className="h-4 w-4" />{conversations.length} {conversations.length === 1 ? t("chat_count_singular") : t("chat_count_plural")}</span>} />{loadingMessages ? <div className="space-y-3">{[1, 2, 3, 4].map((item) => <div key={item} className="flex items-center gap-4 rounded-[1.5rem] border border-slate-100 bg-white p-4"><div className="h-14 w-14 animate-pulse rounded-[1.25rem] bg-slate-100" /><div className="flex-1 space-y-3"><div className="h-4 w-1/3 animate-pulse rounded-full bg-slate-100" /><div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-100" /></div></div>)}</div> : conversations.length === 0 ? <PremiumEmptyState icon={<MessageCircle className="h-6 w-6" />} title={t("no_conversations") || "No conversations yet"} description={t("no_conversations_desc") || "Start a chat from any property to keep questions and interest organized here."} ctaLabel="Find a listing" ctaHref="/" /> : <div className="space-y-3">{conversations.map((conversation) => { const query = new URLSearchParams({ recipientId: conversation.otherUser.id }).toString(); const youPrefix = conversation.lastMessage.senderId === user.id ? t("you_prefix") : ""; return <Link key={conversation.otherUser.id} href={`/chat?${query}`} className={`group flex items-center gap-4 rounded-[1.5rem] border p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(15,23,42,0.08)] ${conversation.unreadCount > 0 ? "border-emerald-200 bg-emerald-50/60" : "border-slate-100 bg-white"}`}><div className="relative"><div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-slate-900 via-teal-700 to-emerald-400 text-lg font-black text-white shadow-lg shadow-slate-900/10">{conversation.otherUser.avatarUrl ? <SafeImage src={conversation.otherUser.avatarUrl} alt={conversation.otherUser.name} className="h-full w-full object-cover" fallbackSrc="/images/defaultimage.jpg" /> : getInitials(conversation.otherUser.name)}</div>{conversation.unreadCount > 0 ? <span className="absolute -right-1 -top-1 flex min-h-[22px] min-w-[22px] items-center justify-center rounded-full bg-slate-900 px-1.5 text-[11px] font-bold text-white">{conversation.unreadCount}</span> : null}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900 sm:text-base">{conversation.otherUser.name}</p><p className={`mt-1 truncate text-sm ${conversation.unreadCount > 0 ? "font-semibold text-slate-900" : "text-slate-500"}`}>{youPrefix}{conversation.lastMessage.content}</p></div><div className="flex flex-shrink-0 items-center gap-1 text-xs text-slate-400"><Clock3 className="h-3.5 w-3.5" />{chatTime(conversation.lastMessage.created_at)}</div></div></div><ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-300 transition-colors group-hover:text-teal-600" /></Link>; })}</div>}</div> : null}
            </section>
          </div>
        </div>
      </div>

      {editingHouse ? <EditPropertyModal house={editingHouse} onClose={() => setEditingHouse(null)} onSuccess={() => { setEditingHouse(null); fetchMyHouses(); }} /> : null}
      {isDrawerOpen ? <div className="fixed inset-0 z-50 flex justify-end"><div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} /><div className="relative z-50 flex h-full w-full max-w-sm flex-col bg-[var(--theme-surface)] shadow-2xl"><div className="flex items-center justify-between border-b border-[var(--theme-border)] px-6 py-5"><h2 className="flex items-center gap-2 text-lg font-bold text-[var(--theme-text)]"><Settings className="h-5 w-5 text-[var(--theme-text-muted)]" />{t("settings")}</h2><button type="button" onClick={() => setIsDrawerOpen(false)} className="rounded-full p-2 text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-2)]"><X className="h-5 w-5" /></button></div><div className="flex-1 overflow-y-auto px-4 py-4"><div className="space-y-2"><div className="rounded-[1.25rem] border border-[var(--theme-border)] bg-[var(--theme-surface-2)] p-4"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--theme-text-muted)]">Theme</p><div className="mt-3"><ThemeToggle /></div></div><DrawerLink href="/profile/accounts-center" icon={<UserCog className="h-5 w-5" />} label={t("accounts_center")} /><div className="overflow-hidden rounded-[1.25rem] border border-[var(--theme-border)] bg-[var(--theme-surface-2)]"><button type="button" onClick={() => setIsLangExpanded((value) => !value)} className="flex w-full items-center justify-between px-4 py-4 text-left text-sm font-semibold text-[var(--theme-text)]"><span className="flex items-center gap-3"><Globe className="h-5 w-5 text-[var(--theme-text-muted)]" />{t("app_language")}</span><ChevronRight className={`h-4 w-4 text-[var(--theme-text-muted)] transition-transform ${isLangExpanded ? "rotate-90" : ""}`} /></button>{isLangExpanded ? <div className="border-t border-[var(--theme-border)] bg-[var(--theme-surface)] py-2">{(Object.entries(FLAGS) as [Language, { url: string; label: string }][]).map(([key, flag]) => <button key={key} type="button" onClick={() => { setLanguage(key); setIsDrawerOpen(false); setIsLangExpanded(false); }} className={`flex w-full items-center gap-3 px-4 py-3 text-sm ${language === key ? "bg-teal-50 font-semibold text-teal-700" : "text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-2)]"}`}><SafeImage src={flag.url} alt={flag.label} className="h-auto w-5 rounded-sm shadow-sm" fallbackSrc="/images/defaultimage.jpg" /><span>{flag.label}</span></button>)}</div> : null}</div><DrawerLink href="/profile/help-support" icon={<HelpCircle className="h-5 w-5" />} label={t("help_support")} /><DrawerLink href="/about" icon={<Info className="h-5 w-5" />} label={t("about")} /></div></div></div></div> : null}
    </div>
  );
}

function SectionHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) { return <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">{eyebrow}</p><h2 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">{title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p></div>{action ? <div className="flex-shrink-0">{action}</div> : null}</div>; }
function PremiumEmptyState({ icon, title, description, ctaLabel, ctaHref }: { icon: ReactNode; title: string; description: string; ctaLabel: string; ctaHref: string }) { return <div className="rounded-[1.75rem] border border-dashed border-emerald-200 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),transparent_40%),linear-gradient(180deg,#ffffff_0%,#f0fdf4_100%)] p-8 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/10">{icon}</div><h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p><Link href={ctaHref} className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"><Home className="h-4 w-4" />{ctaLabel}</Link></div>; }
function MetricPill({ icon, label }: { icon: ReactNode; label: string }) { return <div className="flex items-center justify-center gap-1.5 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600"><span className="text-teal-600">{icon}</span><span className="truncate">{label}</span></div>; }
function DashboardMetric({ title, value }: { title: string; value: string }) { return <div className="rounded-[1.25rem] bg-slate-50 p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{title}</p><p className="mt-2 text-sm font-bold text-slate-900">{value}</p></div>; }
function DrawerLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) { return <Link href={href} className="flex items-center justify-between rounded-[1.25rem] border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-4 text-sm font-semibold text-[var(--theme-text)] hover:border-teal-100 hover:bg-[var(--theme-surface-2)] hover:text-teal-700"><span className="flex items-center gap-3"><span className="text-[var(--theme-text-muted)]">{icon}</span>{label}</span><ChevronRight className="h-4 w-4 text-[var(--theme-text-muted)]" /></Link>; }
