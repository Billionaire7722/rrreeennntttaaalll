"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Camera, Heart, MessageCircle, User as UserIcon, Home, Pencil, Trash2,
  MapPin, DollarSign, BedDouble, ChevronRight,
  Clock, Building2, Settings, Menu, UserCog, Globe, HelpCircle, Info, X
} from "lucide-react";
import api from "@/api/axios";
import PropertyCard from "@/components/PropertyCard";
import PropertyList from "@/components/PropertyList";
import { useAuth } from "@/context/useAuth";
import { useLanguage, Language } from "@/context/LanguageContext";
import EditPropertyModal from "@/components/EditPropertyModal";

const FLAGS: Record<Language, { url: string, label: string }> = {
    vi: { url: "https://flagcdn.com/w20/vn.png", label: "Tiếng Việt" },
    en: { url: "https://flagcdn.com/w20/gb.png", label: "English" },
    es: { url: "https://flagcdn.com/w20/es.png", label: "Español" },
    fr: { url: "https://flagcdn.com/w20/fr.png", label: "Français" },
    zh: { url: "https://flagcdn.com/w20/cn.png", label: "简体中文" },
    "zh-TW": { url: "https://flagcdn.com/w20/tw.png", label: "繁體中文" },
    ko: { url: "https://flagcdn.com/w20/kr.png", label: "한국어" },
    ja: { url: "https://flagcdn.com/w20/jp.png", label: "日本語" },
    th: { url: "https://flagcdn.com/w20/th.png", label: "ไทย" },
    id: { url: "https://flagcdn.com/w20/id.png", label: "Bahasa Indonesia" },
};

function getInitials(name: string): string {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

interface ViewerMessage {
  id: string;
  content: string;
  senderId: string;
  senderRole: string;
  created_at: string;
  adminId?: string | null;
  seen_at?: string | null;
  seen_by_role?: string | null;
  admin?: { id: string; name: string; username?: string; avatarUrl?: string | null } | null;
}

interface MyHouse {
  id: string;
  name: string;
  property_type?: string;
  address: string;
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
}

const resolveUploadImageUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl) return `${envUrl.replace(/\/+$/, "")}/upload/image`;
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:3000/upload/image`;
  }
  return "http://localhost:3000/upload/image";
};

function formatPrice(price?: number) {
  if (!price) return "N/A";
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M VND`;
  if (price >= 1_000) return `${(price / 1_000).toFixed(0)}K VND`;
  return `${price} VND`;
}

function resolvePropertyLabel(house: { property_type?: string | null; name: string }) {
  if (house.property_type) return house.property_type;
  // Fallback: extract type from auto-generated name like "house at ..."
  const atIndex = house.name?.indexOf(' at ');
  if (atIndex > 0) return house.name.slice(0, atIndex);
  return house.name;
}

function getStatusColor(status?: string) {
  switch (status?.toUpperCase()) {
    case "AVAILABLE": return "bg-emerald-100 text-emerald-700";
    case "RENTED": return "bg-rose-100 text-rose-700";
    case "PENDING": return "bg-amber-100 text-amber-700";
    default: return "bg-gray-100 text-gray-600";
  }
}

export default function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [myHouses, setMyHouses] = useState<MyHouse[]>([]);
  const [loadingFavs, setLoadingFavs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMyHouses, setLoadingMyHouses] = useState(false);
  const [activeTab, setActiveTab] = useState<"favorites" | "messages" | "my-properties">("favorites");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  
  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState({ type: '', text: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [editingHouse, setEditingHouse] = useState<MyHouse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLangExpanded, setIsLangExpanded] = useState(false);


  const fetchFavorites = async () => {
    try {
      const res = await api.get("/users/favorites");
      const formatted = res.data.map((fav: any) => {
        const h = fav.house;
        const propertyLabel = h.property_type || (h.name?.indexOf(' at ') > 0 ? h.name.slice(0, h.name.indexOf(' at ')) : h.name);
        return {
          id: h.id, title: propertyLabel, address: `${h.district ? `${h.district}, ` : ""}${h.city}`,
          city: h.city, latitude: h.latitude, longitude: h.longitude, price: h.price,
          bedrooms: h.bedrooms, bathrooms: h.bathrooms || 1, hasPrivateBathroom: h.is_private_bathroom,
          area: h.square, description: h.description, status: h.status || "AVAILABLE",
          image_url: h.image_url_1 || h.image_url_2 || "/images/defaultimage.jpg",
        };
      });
      setFavorites(formatted);
    } catch { } finally { setLoadingFavs(false); }
  };

  const fetchConversations = async () => {
    if (!user) return;
    setLoadingMessages(true);
    try {
      const res = await api.get("/users/conversations");
      setConversations(res.data || []);
    } catch { } finally { setLoadingMessages(false); }
  };

  const fetchMyHouses = async () => {
    setLoadingMyHouses(true);
    try {
      const res = await api.get("/houses/me");
      setMyHouses(res.data?.data || []);
    } catch { } finally { setLoadingMyHouses(false); }
  };

  const handleDeleteHouse = async (houseId: string) => {
    if (!confirm("Are you sure you want to delete this property? This cannot be undone.")) return;
    try {
      await api.delete(`/houses/${houseId}`);
      setMyHouses(prev => prev.filter(h => h.id !== houseId));
    } catch { alert("Failed to delete property."); }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchFavorites();
      fetchMyHouses();
      api.get("/users/profile").then(res => {
        if (res.data.avatarUrl) {
          setAvatarUrl(res.data.avatarUrl);
          localStorage.setItem(`avatar_${user.id}`, res.data.avatarUrl);
        } else {
          const saved = localStorage.getItem(`avatar_${user.id}`);
          if (saved) setAvatarUrl(saved);
        }
        if (res.data.coverUrl) {
          setCoverUrl(res.data.coverUrl);
          localStorage.setItem(`cover_${user.id}`, res.data.coverUrl);
        } else {
          const savedCover = localStorage.getItem(`cover_${user.id}`);
          if (savedCover) setCoverUrl(savedCover);
        }
        setEditFirstName(res.data.firstName || "");
        setEditLastName(res.data.lastName || "");
        setEditBio(res.data.bio || "");
      }).catch(() => {
        const saved = localStorage.getItem(`avatar_${user.id}`);
        if (saved) setAvatarUrl(saved);
        const savedCover = localStorage.getItem(`cover_${user.id}`);
        if (savedCover) setCoverUrl(savedCover);
      });
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    if (activeTab === "messages") fetchConversations();
  }, [activeTab, user]);

  const handleRemoveFavorite = async (propertyId: string) => {
    try {
      await api.post("/users/favorites/toggle", { houseId: propertyId });
      setFavorites(prev => prev.filter(p => p.id !== propertyId));
    } catch { }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.data && response.data.url) {
        setAvatarUrl(response.data.url);
        if (user) {
          localStorage.setItem(`avatar_${user.id}`, response.data.url);
          try { await api.post("/users/avatar", { url: response.data.url }); } catch { }
        }
      }
    } catch { } finally { setIsUploading(false); }
  };

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.data && response.data.url) {
        setCoverUrl(response.data.url);
        if (user) {
          localStorage.setItem(`cover_${user.id}`, response.data.url);
          try { await api.post("/users/cover", { url: response.data.url }); } catch { }
        }
      }
    } catch { } finally { setIsUploadingCover(false); }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMessage({ type: '', text: '' });
    try {
      await api.post("/users/profile", { 
        firstName: editFirstName, 
        lastName: editLastName, 
        bio: editBio 
      });
      setSettingsMessage({ type: 'success', text: 'changed successful' });
      setIsEditingProfile(false);
      setTimeout(() => setSettingsMessage({ type: '', text: '' }), 3000);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setSettingsMessage({ type: 'error', text: err.response.data.message || 'You can only change your name once every 30 days.' });
      } else {
        setSettingsMessage({ type: 'error', text: 'Failed to update profile.' });
      }
    } finally {
      setSavingSettings(false);
    }
  };


  // ─── Not logged in ────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-60px)] flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-teal-100 animate-pulse" />
          <div className="h-4 w-32 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-3 w-24 bg-gray-100 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-60px)] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="max-w-sm w-full">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-teal-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserIcon className="h-10 w-10 text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{t("welcome_home")}</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              Sign in to save your favorite properties, track your listings, and connect with landlords.
            </p>
            <div className="space-y-3">
              <Link
                href="/login"
                className="flex w-full items-center justify-center px-6 py-3 text-base font-semibold rounded-xl text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all hover:-translate-y-0.5"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="flex w-full items-center justify-center px-6 py-3 text-base font-semibold rounded-xl text-teal-600 bg-teal-50 hover:bg-teal-100 transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-6">Find your perfect rental home with Your Home</p>
        </div>
      </div>
    );
  }

  // ─── Tabs config ──────────────────────────────────────────────────────────
  const tabs = [
    { key: "favorites" as const, label: t("saved"), icon: Heart, count: favorites.length },
    { key: "my-properties" as const, label: t("my_listings"), icon: Building2, count: myHouses.length },
    { key: "messages" as const, label: t("chats"), icon: MessageCircle, count: conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0) },
  ];

  // ─── Main layout ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-60px)] bg-gray-50 pb-28">

      {/* ── Hero / Cover ─────────────────────────────────────────────────── */}
      <div className="relative w-full h-44 sm:h-56 md:h-64 overflow-hidden group">
        <img
          src={coverUrl || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80"}
          alt="Cover"
          className={`w-full h-full object-cover transition-opacity ${isUploadingCover ? "opacity-60" : ""}`}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-teal-900/30 via-teal-800/20 to-gray-900/60" />
        
        {/* Navigation Drawer Trigger */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 text-white/90 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full transition-all focus:outline-none shadow-sm"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Edit Cover Overlay — always available on hover */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          onClick={() => coverInputRef.current?.click()}
        >
          {isUploadingCover ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-white text-sm font-bold">{t("loading")}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-white font-medium">
              <Camera className="w-5 h-5" />
              <span className="text-sm">{t("edit_cover")}</span>
            </div>
          )}
        </div>
        <input type="file" accept="image/*" ref={coverInputRef} className="hidden" onChange={handleCoverFileChange} />
      </div>

      {/* ── Profile card (overlapping hero) ──────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 sm:-mt-20 mb-6">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

            {/* Avatar + name row */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 px-5 sm:px-8 pt-5 sm:pt-6 pb-5 sm:pb-6">
              {/* Avatar */}
              <div
                className="relative cursor-pointer group flex-shrink-0 self-center sm:self-auto"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-teal-100 to-teal-50 flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className={`w-full h-full object-cover transition-opacity ${isUploading ? "opacity-40" : ""}`}
                    />
                  ) : (
                    <UserIcon className={`w-12 h-12 text-teal-400 ${isUploading ? "opacity-40" : ""}`} />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                    {isUploading
                      ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span className="text-white text-[10px] font-bold">{t("loading")}</span>
                        </div>
                      )
                      : <Camera className="text-white w-6 h-6" />
                    }
                  </div>
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center shadow-md border-2 border-white">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
              </div>

              {/* Name / email / bio / edit form */}
              <div className="flex-1 text-center sm:text-left min-w-0 flex flex-col items-center sm:items-start">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 justify-center sm:justify-start">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                    {editLastName || user.lastName || ""} {editFirstName || user.firstName || user.name || "User"}
                  </h1>
                </div>
                <p className="text-sm text-gray-500 mt-0.5 truncate">{user.email}</p>

                {!isEditingProfile ? (
                  <>
                    {editBio && (
                      <p className="mt-4 text-sm text-gray-700 leading-relaxed max-w-lg break-words whitespace-pre-wrap">
                        {editBio}
                      </p>
                    )}
                    <button
                      onClick={() => { setIsEditingProfile(true); setSettingsMessage({type:'', text:''}); }}
                      className="mt-4 px-4 py-1.5 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-100 rounded-lg transition-colors inline-block"
                    >
                      <div className="flex items-center gap-1.5 justify-center"><Pencil className="w-3.5 h-3.5" /> {t("edit_profile")}</div>
                    </button>
                    {settingsMessage.text && settingsMessage.type === 'success' && (
                        <p className="mt-3 text-xs text-emerald-600 font-medium">{settingsMessage.text}</p>
                    )}
                  </>
                ) : (
                  <form onSubmit={handleSaveSettings} className="mt-5 w-full max-w-lg bg-gray-50 p-4 rounded-xl border border-gray-100/50 text-left">
                    {settingsMessage.text && (
                      <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${settingsMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        {settingsMessage.text}
                      </div>
                    )}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold text-gray-700">{t("last_name") || "Họ"}</label>
                          <input
                            type="text"
                            className="w-full mt-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm"
                            value={editLastName}
                            onChange={e => setEditLastName(e.target.value)}
                            placeholder="Last name"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-700">{t("first_name") || "Tên"}</label>
                          <input
                            type="text"
                            className="w-full mt-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm"
                            value={editFirstName}
                            onChange={e => setEditFirstName(e.target.value)}
                            placeholder="First name"
                            required
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{t("change_limit")}</p>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-sm font-semibold text-gray-700">{t("bio")}</label>
                            <span className={`text-xs ${editBio.length > 200 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                {editBio.length}/200
                            </span>
                        </div>
                        <textarea
                          maxLength={200}
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm resize-none"
                          value={editBio}
                          onChange={e => setEditBio(e.target.value)}
                          placeholder={t("bio_placeholder")}
                        />
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => { setIsEditingProfile(false); setSettingsMessage({type:'', text:''}); }}
                          className="flex-1 sm:flex-none px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors text-sm"
                        >
                          {t("cancel")}
                        </button>
                        <button
                          type="submit"
                          disabled={savingSettings || editBio.length > 200}
                          className="flex-1 sm:flex-none px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                        >
                          {savingSettings ? t("uploading") : t("save_changes")}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>

              {/* Actions */}
              {/* Removed the extra action div since Menu moved to the cover */}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 border-t border-gray-100">
              {[
                { label: t("saved"), value: favorites.length, icon: Heart, color: "text-rose-500" },
                { label: t("my_listings"), value: myHouses.length, icon: Building2, color: "text-teal-500" },
              ].map((stat, i) => (
                <div key={i} className={`flex flex-col items-center py-4 gap-1 ${i === 0 ? "border-r border-gray-100" : ""}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tab navigation ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 px-4 py-4 text-sm font-semibold transition-all relative whitespace-nowrap
                  ${activeTab === tab.key
                    ? "text-teal-600 bg-teal-50/50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center
                    ${activeTab === tab.key ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500"}`}>
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-500 rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-4 sm:p-6">

            {/* ── Favorites ─────────────────────────────────────────────── */}
            {activeTab === "favorites" && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-gray-900">{t("saved_properties") || "Saved Properties"}</h2>
                </div>

                {loadingFavs ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <PropertyList
                    properties={favorites}
                    onToggleFavorite={handleRemoveFavorite}
                    favorites={new Set(favorites.map(f => f.id))}
                    emptyIcon={<Heart className="w-10 h-10" />}
                    emptyTitle={t("no_saved_properties") || "No saved properties"}
                    emptyDescription={t("save_properties_hint") || "Tap the heart icon on any property to save it here."}
                    storageKey="saved_properties_view_mode"
                  />
                )}
              </div>
            )}

            {/* ── My Properties ─────────────────────────────────────────── */}
            {activeTab === "my-properties" && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-gray-900">{t("my_listings_title") || "My Listings"}</h2>
                </div>

                {loadingMyHouses ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2].map(i => (
                      <div key={i} className="h-52 bg-gray-100 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <PropertyList
                    properties={myHouses.map(h => ({
                        ...h,
                        title: h.name,
                        image_url: h.image_url_1 || '',
                        area: h.square || 0,
                        bedrooms: h.bedrooms || 0,
                        price: h.price || 0,
                        status: h.status || 'AVAILABLE'
                    }))}
                    onEdit={(property) => setEditingHouse(property as any)}
                    onDelete={(id) => handleDeleteHouse(id)}
                    emptyIcon={<Building2 className="w-10 h-10" />}
                    emptyTitle={t("no_listings_yet") || "No listings yet"}
                    emptyDescription={t("add_listing_hint") || "Use the + button at the bottom to add your first property."}
                    storageKey="my_listings_view_mode"
                  />
                )}
              </div>
            )}

            {/* ── Messages ──────────────────────────────────────────────── */}
            {activeTab === "messages" && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-gray-900">Conversations</h2>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
                    {conversations.length} {conversations.length === 1 ? "chat" : "chats"}
                  </span>
                </div>

                {loadingMessages ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  <EmptyState
                    icon={<MessageCircle className="w-10 h-10 text-gray-300" />}
                    title="No conversations yet"
                    description="Your chat history with admins will appear here."
                  />
                ) : (
                  <div className="space-y-3">
                    {conversations.map(conv => {
                      const latest = conv.lastMessage;
                      const other = conv.otherUser;
                      const query = new URLSearchParams({ recipientId: other.id }).toString();
                      const timeStr = new Date(latest.created_at).toLocaleString("vi-VN", {
                        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
                      });

                      return (
                        <Link
                          key={other.id}
                          href={`/chat?${query}`}
                          className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-teal-200 hover:shadow-md transition-all duration-200 group"
                        >
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-100 to-teal-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {other.avatarUrl ? (
                              <img src={other.avatarUrl} alt={other.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-teal-600 font-bold bg-teal-50">
                                {getInitials(other.name)}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <p className="text-sm font-bold text-gray-900 truncate">{other.name}</p>
                              <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
                                <Clock className="w-3 h-3" />{timeStr}
                              </span>
                            </div>
                            <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                              {latest.senderId === user.id ? "You: " : ""}{latest.content}
                            </p>
                          </div>

                          {/* Unread badge + chevron */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {conv.unreadCount > 0 && (
                              <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-xs font-bold text-white bg-teal-500 rounded-full">
                                {conv.unreadCount}
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-teal-500 transition-colors" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingHouse && (
        <EditPropertyModal
          house={editingHouse}
          onClose={() => setEditingHouse(null)}
          onSuccess={() => { setEditingHouse(null); fetchMyHouses(); }}
        />
      )}

      {/* Navigation Drawer Overlay */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsDrawerOpen(false)} />
          <div className="w-80 bg-white h-full shadow-2xl relative z-50 flex flex-col pt-16 animate-in slide-in-from-right duration-300">
            {/* Drawer Header Layout */}
            <div className="absolute top-4 right-4">
              <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="px-6 pb-4 border-b border-gray-100">
              <h2 className="text-xl font-bold flex items-center gap-2"><Settings className="w-5 h-5 text-gray-500" /> {t("settings")}</h2>
            </div>
            
            {/* Drawer Links */}
            <div className="flex-1 overflow-y-auto py-2">
              <div className="px-4 space-y-1">
                <Link href="/profile/accounts-center" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                  <UserCog className="w-5 h-5 text-gray-400" />
                  {t("accounts_center")}
                </Link>

                <div className="rounded-xl overflow-hidden transition-all">
                  <button 
                    onClick={() => setIsLangExpanded(!isLangExpanded)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-400" />
                      {t("app_language")}
                    </div>
                    <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${isLangExpanded ? 'rotate-90' : ''}`} />
                  </button>
                  {isLangExpanded && (
                    <div className="bg-gray-50/50 pt-1 pb-2">
                      {(Object.entries(FLAGS) as [Language, { url: string, label: string }][]).map(([key, flag]) => (
                          <button
                              key={key}
                              onClick={() => { setLanguage(key); setIsDrawerOpen(false); setIsLangExpanded(false); }}
                              className={`w-full flex items-center gap-3 px-11 py-2.5 text-sm hover:bg-teal-50 hover:text-teal-700 transition-colors ${language === key ? 'text-teal-600 font-semibold' : 'text-gray-600'}`}
                          >
                              <img src={flag.url} alt={key} className="w-5 h-auto rounded-sm shadow-sm" />
                              <span>{flag.label}</span>
                          </button>
                      ))}
                    </div>
                  )}
                </div>

                <Link href="/profile/help-support" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                  <HelpCircle className="w-5 h-5 text-gray-400" />
                  {t("help_support")}
                </Link>
                
                <Link href="/about" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                  <Info className="w-5 h-5 text-gray-400" />
                  {t("about")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
      <div className="mb-4 text-gray-300">{icon}</div>
      <h3 className="text-base font-bold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 max-w-xs">{description}</p>
    </div>
  );
}
