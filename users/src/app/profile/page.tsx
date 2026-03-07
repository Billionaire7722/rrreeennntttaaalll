"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Camera, Heart, MessageCircle, User as UserIcon, Home, Pencil, Trash2, MapPin, DollarSign, BedDouble } from "lucide-react";
import api from "@/api/axios";
import PropertyCard from "@/components/PropertyCard";
import { useAuth } from "@/context/useAuth";
import EditPropertyModal from "@/components/EditPropertyModal";

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

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [messages, setMessages] = useState<ViewerMessage[]>([]);
  const [myHouses, setMyHouses] = useState<MyHouse[]>([]);
  const [loadingFavs, setLoadingFavs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMyHouses, setLoadingMyHouses] = useState(false);
  const [activeTab, setActiveTab] = useState<"favorites" | "messages" | "my-properties">("favorites");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingHouse, setEditingHouse] = useState<MyHouse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const conversations = useMemo(() => {
    const map = new Map<string, { adminId: string; adminName: string; latest: ViewerMessage; unread: number }>();
    for (const msg of messages) {
      const adminId = msg.adminId || msg.admin?.id;
      if (!adminId) continue;
      const adminName = msg.admin?.name || msg.admin?.username || "Admin";
      const current = map.get(adminId);
      const msgTime = new Date(msg.created_at).getTime();
      const unreadFromAdmin = (msg.senderRole === "ADMIN" || msg.senderRole === "SUPER_ADMIN") && msg.seen_by_role !== "VIEWER";
      if (!current || msgTime > new Date(current.latest.created_at).getTime()) {
        map.set(adminId, { adminId, adminName, latest: msg, unread: (current?.unread || 0) + (unreadFromAdmin ? 1 : 0) });
      } else if (unreadFromAdmin) { current.unread += 1; map.set(adminId, current); }
    }
    return Array.from(map.values()).sort((a, b) => new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime());
  }, [messages]);

  const fetchFavorites = async () => {
    try {
      const res = await api.get("/users/favorites");
      const formatted = res.data.map((fav: any) => {
        const h = fav.house;
        return {
          id: h.id, title: h.name, address: `${h.district ? `${h.district}, ` : ""}${h.city}`,
          city: h.city, latitude: h.latitude, longitude: h.longitude, price: h.price,
          bedrooms: h.bedrooms, bathrooms: h.bathrooms || 1, hasPrivateBathroom: h.is_private_bathroom,
          area: h.square, description: h.description, status: h.status || "AVAILABLE",
          image_url: h.image_url_1 || h.image_url_2 || "/images/defaultimage.jpg",
        };
      });
      setFavorites(formatted);
    } catch { } finally { setLoadingFavs(false); }
  };

  const fetchMessages = async () => {
    if (!user) return;
    setLoadingMessages(true);
    try {
      const res = await api.get("/users/messages");
      const items = Array.isArray(res.data) ? res.data : [];
      setMessages(items.sort((a: ViewerMessage, b: ViewerMessage) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
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
      api.get("/users/profile").then(res => {
        if (res.data.avatarUrl) {
          setAvatarUrl(res.data.avatarUrl);
          localStorage.setItem(`avatar_${user.id}`, res.data.avatarUrl);
        } else {
          const saved = localStorage.getItem(`avatar_${user.id}`);
          if (saved) setAvatarUrl(saved);
        }
      }).catch(() => {
        const saved = localStorage.getItem(`avatar_${user.id}`);
        if (saved) setAvatarUrl(saved);
      });
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    if (activeTab === "messages") fetchMessages();
    if (activeTab === "my-properties") fetchMyHouses();
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
      const response = await fetch(resolveUploadImageUrl(), { method: "POST", body: formData });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      if (data.url) {
        setAvatarUrl(data.url);
        if (user) {
          localStorage.setItem(`avatar_${user.id}`, data.url);
          try { await api.post("/users/avatar", { url: data.url }); } catch { }
        }
      }
    } catch { } finally { setIsUploading(false); }
  };

  if (authLoading) return <div className="p-12 text-center animate-pulse">Loading...</div>;

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <UserIcon className="h-10 w-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Not logged in</h2>
        <p className="text-gray-500 mb-8">Please sign in to view your profile.</p>
        <Link href="/login" className="inline-flex w-full items-center justify-center px-6 py-3.5 text-base font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition">
          Sign in / Register
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 min-h-[calc(100vh-60px)] py-8 pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-4 lg:max-w-[320px] w-full mx-auto">
            <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 flex flex-col items-center relative overflow-hidden">
              <div className="w-full h-[220px] bg-gradient-to-br from-blue-500 to-teal-400 relative">
                <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" className="w-full h-full object-cover opacity-90 mix-blend-overlay" alt="Cover" />
              </div>
              <div className="relative -mt-[56px] flex justify-center w-full z-10 px-6">
                <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-[112px] h-[112px] rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100 flex items-center justify-center relative">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className={`w-full h-full object-cover ${isUploading ? "opacity-50" : ""}`} />
                    ) : (
                      <UserIcon className={`w-12 h-12 text-gray-400 ${isUploading ? "opacity-50" : ""}`} />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {isUploading ? <span className="text-white text-xs font-bold">Uploading...</span> : <Camera className="text-white w-6 h-6" />}
                    </div>
                  </div>
                  <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                </div>
              </div>
              <div className="p-6 w-full text-center">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{user.name || "User"}</h1>
                <p className="text-sm text-gray-500 mt-1 mb-6">{user.email}</p>
                <div className="w-full pt-6 border-t border-gray-100 grid grid-cols-3 gap-2 divide-x divide-gray-100 mb-6">
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Saved</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{favorites.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Chats</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{conversations.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Listed</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{myHouses.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden min-h-[600px] flex flex-col">
              {/* Tabs */}
              <div className="flex border-b border-gray-100 bg-white px-8 pt-6 gap-8 overflow-x-auto">
                <button onClick={() => setActiveTab("favorites")} className={`pb-4 text-[15px] font-semibold transition-all relative whitespace-nowrap ${activeTab === "favorites" ? "text-blue-600" : "text-gray-500 hover:text-gray-800"}`}>
                  <span className="flex items-center gap-2"><Heart className="w-4 h-4" /> Saved properties</span>
                  {activeTab === "favorites" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
                </button>
                <button onClick={() => setActiveTab("my-properties")} className={`pb-4 text-[15px] font-semibold transition-all relative whitespace-nowrap ${activeTab === "my-properties" ? "text-blue-600" : "text-gray-500 hover:text-gray-800"}`}>
                  <span className="flex items-center gap-2"><Home className="w-4 h-4" /> My Properties</span>
                  {activeTab === "my-properties" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
                </button>
                <button onClick={() => setActiveTab("messages")} className={`pb-4 text-[15px] font-semibold transition-all relative whitespace-nowrap ${activeTab === "messages" ? "text-blue-600" : "text-gray-500 hover:text-gray-800"}`}>
                  <span className="flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Conversations</span>
                  {activeTab === "messages" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
                </button>
              </div>

              <div className="p-8 flex-1 bg-gray-50/30">
                {/* Favorites */}
                {activeTab === "favorites" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-bold text-gray-900">Saved properties</h3>
                      <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">{favorites.length} items</span>
                    </div>
                    {loadingFavs ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{[1, 2].map(i => <div key={i} className="h-[280px] bg-gray-100 rounded-xl animate-pulse" />)}</div>
                    ) : favorites.length === 0 ? (
                      <div className="text-center py-20 px-4 bg-white rounded-xl border border-dashed border-gray-200">
                        <Heart className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-1">No saved properties</h3>
                        <p className="text-gray-500 text-sm">Tap the heart icon on a property to save it here.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {favorites.map(property => (
                          <PropertyCard key={property.id} property={property} isFavorite onToggleFavorite={handleRemoveFavorite} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* My Properties */}
                {activeTab === "my-properties" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-bold text-gray-900">My Properties</h3>
                      <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">{myHouses.length} listed</span>
                    </div>
                    {loadingMyHouses ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1, 2].map(i => <div key={i} className="h-[200px] bg-gray-100 rounded-xl animate-pulse" />)}</div>
                    ) : myHouses.length === 0 ? (
                      <div className="text-center py-20 px-4 bg-white rounded-xl border border-dashed border-gray-200">
                        <Home className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-1">No properties listed yet</h3>
                        <p className="text-gray-500 text-sm">Use the + button at the bottom to add your first property.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myHouses.map(house => (
                          <div key={house.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            <div className="relative h-40 bg-gray-100">
                              {house.image_url_1 ? (
                                <img src={house.image_url_1} alt={house.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  <Home size={40} />
                                </div>
                              )}
                              <div className="absolute top-2 right-2 flex gap-1.5">
                                <button onClick={() => setEditingHouse(house)} className="p-1.5 bg-white rounded-lg shadow-sm text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                                  <Pencil size={15} />
                                </button>
                                <button onClick={() => handleDeleteHouse(house.id)} className="p-1.5 bg-white rounded-lg shadow-sm text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                                  <Trash2 size={15} />
                                </button>
                              </div>
                              {house.status && (
                                <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full capitalize">{house.status}</span>
                              )}
                            </div>
                            <div className="p-4">
                              <h4 className="font-semibold text-gray-900 truncate">{house.name}</h4>
                              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                <MapPin size={11} /> {house.district ? `${house.district}, ` : ""}{house.city}
                              </p>
                              <div className="flex items-center gap-4 mt-3 text-sm text-gray-700">
                                {house.price && <span className="flex items-center gap-1 text-blue-600 font-medium"><DollarSign size={13} /> {formatPrice(house.price)}</span>}
                                {house.bedrooms && <span className="flex items-center gap-1"><BedDouble size={13} /> {house.bedrooms} BR</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Messages */}
                {activeTab === "messages" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-bold text-gray-900">Conversations</h3>
                      <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">{conversations.length} conversations</span>
                    </div>
                    {loadingMessages ? (
                      <div className="text-center py-20 text-gray-500 animate-pulse">Loading messages...</div>
                    ) : conversations.length === 0 ? (
                      <div className="text-center py-20 px-4 bg-white rounded-xl border border-dashed border-gray-200">
                        <MessageCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-1">No conversations yet</h3>
                        <p className="text-gray-500 text-sm">Your chat history will appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {conversations.map(conversation => {
                          const latest = conversation.latest;
                          const query = new URLSearchParams({ adminId: conversation.adminId }).toString();
                          const prefix = latest.senderRole === "VIEWER" ? "You: " : "Admin: ";
                          return (
                            <Link key={conversation.adminId} href={`/chat?${query}`} className="block rounded-xl border border-gray-100 bg-white p-5 transition-all hover:shadow-md hover:-translate-y-1 duration-300">
                              <div className="mb-3 flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-gray-900 truncate">{conversation.adminName}</p>
                                  <p className="text-xs text-gray-500">Support</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 font-medium">{new Date(latest.created_at).toLocaleString("vi-VN")}</span>
                                  {conversation.unread > 0 && (
                                    <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 text-xs font-bold text-white bg-blue-600 rounded-full">{conversation.unread}</span>
                                  )}
                                </div>
                              </div>
                              <p className="text-[15px] text-gray-700 whitespace-pre-wrap leading-relaxed line-clamp-2">{prefix}{latest.content}</p>
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
    </div>
  );
}
