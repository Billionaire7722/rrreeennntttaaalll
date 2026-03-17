"use client";

import { Camera, User as UserIcon, Pencil } from "lucide-react";

interface ProfileHeaderProps {
  user: any;
  avatarUrl: string | null;
  isUploading: boolean;
  onAvatarClick: () => void;
  isEditing: boolean;
  onEditToggle: () => void;
  t: (key: string) => string;
}

export default function ProfileHeader({
  user,
  avatarUrl,
  isUploading,
  onAvatarClick,
  isEditing,
  onEditToggle,
  t
}: ProfileHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-6 px-6 py-6">
      {/* Avatar Container */}
      <div
        className="relative cursor-pointer group flex-shrink-0 self-center sm:self-auto"
        onClick={onAvatarClick}
      >
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-teal-100 to-teal-50 flex items-center justify-center">
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
            {isUploading ? (
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-white text-[10px] font-bold">{t("loading")}</span>
              </div>
            ) : (
              <Camera className="text-white w-8 h-8" />
            )}
          </div>
        </div>
        
        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shadow-lg border-2 border-white">
          <Camera className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Info Container */}
      <div className="flex-1 text-center sm:text-left min-w-0 flex flex-col items-center sm:items-start pb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
          {user.lastName || ""} {user.firstName || user.name || "User"}
        </h1>
        <p className="text-base text-gray-500 mt-1 truncate">{user.email}</p>
        
        {!isEditing && (
          <button
            onClick={onEditToggle}
            className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-100 rounded-xl transition-all hover:shadow-sm"
          >
            <Pencil className="w-4 h-4" />
            {t("edit_profile")}
          </button>
        )}
      </div>
    </div>
  );
}
