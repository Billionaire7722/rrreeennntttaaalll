"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, Heart, MessageCircle, User as UserIcon } from "lucide-react";
import api from "@/api/axios";
import PropertyCard from "@/components/PropertyCard";
import { useAuth } from "@/context/useAuth";

interface ViewerMessage {
  id: string;
  content: string;
  senderId: string;
  senderRole: string;
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

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [messages, setMessages] = useState<ViewerMessage[]>([]);
  const [loadingFavs, setLoadingFavs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [activeTab, setActiveTab] = useState<"favorites" | "messages">("favorites");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFavorites = async () => {
    try {
      const res = await api.get("/users/favorites");
      const formatted = res.data.map((fav: any) => {
        const h = fav.house;
        return {
          id: h.id,
          title: h.name,
          address: `${h.district ? `${h.district}, ` : ""}${h.city}`,
          city: h.city,
          latitude: h.latitude,
          longitude: h.longitude,
          price: h.price,
          bedrooms: h.bedrooms,
          bathrooms: h.bathrooms || 1,
          hasPrivateBathroom: h.is_private_bathroom,
          area: h.square,
          description: h.description,
          status: h.status || "AVAILABLE",
          image_url: h.image_url_1 || h.image_url_2 || h.image_url_3 || "/images/defaultimage.jpg",
        };
      });
      setFavorites(formatted);
    } catch (err) {
      console.error("Failed to fetch favorites", err);
    } finally {
      setLoadingFavs(false);
    }
  };

  const fetchMessages = async () => {
    if (!user) return;
    setLoadingMessages(true);
    try {
      const res = await api.get("/users/messages");
      const items = Array.isArray(res.data) ? res.data : [];
      setMessages(
        items.sort(
          (a: ViewerMessage, b: ViewerMessage) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
    } catch (err) {
      console.error("Failed to fetch viewer messages", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchFavorites();
      const loadProfile = async () => {
        try {
          const res = await api.get("/users/profile");
          if (res.data.avatarUrl) {
            setAvatarUrl(res.data.avatarUrl);
            localStorage.setItem(`avatar_${user.id}`, res.data.avatarUrl);
          } else {
            const savedAvatar = localStorage.getItem(`avatar_${user.id}`);
            if (savedAvatar) setAvatarUrl(savedAvatar);
          }
        } catch (err) {
          console.error("Failed to load profile", err);
          const savedAvatar = localStorage.getItem(`avatar_${user.id}`);
          if (savedAvatar) setAvatarUrl(savedAvatar);
        }
      };

      loadProfile();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (activeTab === "messages" && user) {
      fetchMessages();
    }
  }, [activeTab, user]);

  const handleRemoveFavorite = async (propertyId: string) => {
    try {
      await api.post("/users/favorites/toggle", { houseId: propertyId });
      setFavorites((prev) => prev.filter((p) => p.id !== propertyId));
    } catch (error) {
      console.error("Failed to remove favorite", error);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(resolveUploadImageUrl(), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();

      if (data.url) {
        setAvatarUrl(data.url);
        if (user) {
          localStorage.setItem(`avatar_${user.id}`, data.url);
          try {
            await api.post("/users/avatar", { url: data.url });
          } catch (updateErr) {
            console.error("Failed to persist avatar on backend", updateErr);
          }
        }
      }
    } catch (err) {
      console.error("Avatar upload error", err);
    } finally {
      setIsUploading(false);
    }
  };

  if (authLoading) {
    return <div className="p-12 text-center animate-pulse">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <UserIcon className="h-10 w-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Not logged in</h2>
        <p className="text-gray-500 mb-8">Please sign in to view profile, favorites and messages.</p>
        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center px-6 py-3.5 border border-transparent text-base font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition"
        >
          Sign in / Register
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 min-h-[calc(100vh-60px)] py-8 pb-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column - User Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 text-center flex flex-col items-center relative overflow-hidden">
              {/* Background pattern */}
              <div className="absolute top-0 w-full h-24 bg-gradient-to-r from-blue-500 to-teal-400"></div>
              <div className="relative mt-8 cursor-pointer group rounded-full p-1 bg-white shadow-sm" onClick={handleAvatarClick}>
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100 flex items-center justify-center relative">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className={`w-full h-full object-cover ${isUploading ? "opacity-50" : ""}`} />
                  ) : (
                    <UserIcon className={`w-10 h-10 text-gray-400 ${isUploading ? "opacity-50" : ""}`} />
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    {isUploading ? (
                      <span className="text-white text-xs font-bold">Tải lên...</span>
                    ) : (
                      <Camera className="text-white w-6 h-6" />
                    )}
                  </div>
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mt-4 tracking-tight">{user.name || "Viewer"}</h1>
              <p className="text-sm text-gray-500 mt-1">{user.email}</p>

              <div className="w-full mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4 divide-x divide-gray-100">
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Đã lưu</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{favorites.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Tin nhắn</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{messages.length}</p>
                </div>
              </div>

              <button className="mt-8 w-full py-2.5 px-4 border border-gray-200 rounded-[12px] text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                Chỉnh sửa hồ sơ
              </button>
            </div>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden min-h-[500px]">
              <div className="flex border-b border-gray-100 bg-white/50 px-6 pt-6 gap-6">
                <button
                  onClick={() => setActiveTab("favorites")}
                  className={`pb-4 text-sm font-semibold transition-all relative ${activeTab === "favorites"
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-gray-800"
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Bất động sản đã lưu
                  </span>
                  {activeTab === "favorites" && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("messages")}
                  className={`pb-4 text-sm font-semibold transition-all relative ${activeTab === "messages"
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-gray-800"
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Tin nhắn của tôi
                  </span>
                  {activeTab === "messages" && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>
                  )}
                </button>
              </div>

              <div className="p-6">
                {activeTab === "favorites" && (
                  <div className="space-y-4">
                    {loadingFavs ? (
                      <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-[120px] bg-gray-100 rounded-[12px] w-full" />
                        ))}
                      </div>
                    ) : favorites.length === 0 ? (
                      <div className="text-center py-20 px-4 bg-gray-50 rounded-[12px] border border-dashed border-gray-200">
                        <Heart className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Chưa có mục đã lưu</h3>
                        <p className="text-gray-500 text-sm max-w-sm mx-auto">Hãy nhấn vào biểu tượng trái tim trên các bài đăng để lưu lại những không gian bạn yêu thích.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {favorites.map((property: any) => (
                          <PropertyCard
                            key={property.id}
                            property={property}
                            isFavorite
                            onToggleFavorite={handleRemoveFavorite}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "messages" && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-gray-900">Cuộc hội thoại</h3>
                      <Link
                        href="/chat"
                        className="inline-flex items-center gap-2 rounded-[10px] bg-blue-50 text-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-100 transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Mở phòng chat
                      </Link>
                    </div>

                    {loadingMessages ? (
                      <div className="text-center py-10 text-gray-500">Đang tải tin nhắn...</div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-16 px-4 bg-gray-50 rounded-[12px] border border-dashed border-gray-200">
                        <MessageCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Chưa có tin nhắn nào</h3>
                        <p className="text-gray-500 text-sm max-w-sm mx-auto">Lịch sử trò chuyện của bạn với ban quản trị sẽ hiển thị tại đây.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((msg) => {
                          const isAdmin = msg.senderRole === "ADMIN" || msg.senderRole === "SUPER_ADMIN";
                          return (
                            <div key={msg.id} className="rounded-[12px] border border-gray-100 bg-gray-50 p-4 transition-all hover:shadow-sm">
                              <div className="mb-2 flex items-center justify-between">
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${isAdmin ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                                    }`}
                                >
                                  {isAdmin ? "Quản trị viên" : "Bạn"}
                                </span>
                                <span className="text-xs text-gray-500 font-medium">
                                  {new Date(msg.created_at).toLocaleString("vi-VN")}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            </div>
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
    </div>
  );
}

