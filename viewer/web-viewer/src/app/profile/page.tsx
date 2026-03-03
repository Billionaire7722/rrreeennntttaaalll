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
      const savedAvatar = localStorage.getItem(`avatar_${user.id}`);
      if (savedAvatar) setAvatarUrl(savedAvatar);
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
        if (user) localStorage.setItem(`avatar_${user.id}`, data.url);
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
    <div className="w-full bg-white min-h-[calc(100vh-60px)] pb-28">
      <div className="bg-white px-4 pt-8 pb-6 border-b border-gray-200">
        <div className="max-w-3xl mx-auto flex items-center gap-5">
          <div className="relative cursor-pointer group" onClick={handleAvatarClick}>
            <div className="w-20 h-20 rounded-full border-4 border-gray-50 shadow-sm overflow-hidden bg-gray-100 flex items-center justify-center relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className={`w-full h-full object-cover ${isUploading ? "opacity-50" : ""}`}
                />
              ) : (
                <UserIcon className={`w-8 h-8 text-gray-400 ${isUploading ? "opacity-50" : ""}`} />
              )}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                {isUploading ? (
                  <span className="text-white text-xs font-bold">Uploading...</span>
                ) : (
                  <Camera className="text-white w-6 h-6" />
                )}
              </div>
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name || "Viewer"}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="sticky top-0 bg-white border-b border-gray-200 z-10 px-4">
        <div className="max-w-3xl mx-auto flex">
          <button
            onClick={() => setActiveTab("favorites")}
            className={`flex-1 py-3.5 text-sm font-semibold border-b-2 transition ${
              activeTab === "favorites"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Favorites ({favorites.length})
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`flex-1 py-3.5 text-sm font-semibold border-b-2 transition ${
              activeTab === "messages"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Messages
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {activeTab === "favorites" && (
          <div className="space-y-4">
            {loadingFavs ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-[120px] bg-gray-200 rounded-xl w-full" />
                ))}
              </div>
            ) : favorites.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 mx-2">
                <Heart className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">No favorites yet</h3>
                <p className="text-gray-500 text-sm">Tap the heart icon on a listing to save it here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="space-y-3">
            <div className="flex justify-end">
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
              >
                <MessageCircle className="h-4 w-4" />
                Open chat
              </Link>
            </div>

            {loadingMessages ? (
              <div className="text-center py-10 text-gray-500">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 mx-2">
                <MessageCircle className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">No messages yet</h3>
                <p className="text-gray-500 text-sm">Your chat history with admins will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((msg) => {
                  const isAdmin = msg.senderRole === "ADMIN" || msg.senderRole === "SUPER_ADMIN";
                  return (
                    <div key={msg.id} className="rounded-xl border border-gray-200 bg-white p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span
                          className={`text-xs font-semibold ${
                            isAdmin ? "text-purple-700" : "text-blue-700"
                          }`}
                        >
                          {isAdmin ? "Admin" : "You"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.created_at).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

