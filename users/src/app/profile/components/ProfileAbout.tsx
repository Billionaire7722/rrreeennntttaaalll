"use client";

import { Info } from "lucide-react";

interface ProfileAboutProps {
  bio: string;
  t: (key: string) => string;
}

export default function ProfileAbout({ bio, t }: ProfileAboutProps) {
  return (
    <div className="p-6">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
        {t("bio") || "Giới thiệu"}
      </h2>
      
      {bio ? (
        <p className="text-gray-700 leading-relaxed max-w-2xl break-words whitespace-pre-wrap">
          {bio}
        </p>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
          <Info className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-400 font-medium">
            {t("no_bio_yet") || "Người dùng chưa thêm giới thiệu."}
          </p>
        </div>
      )}
    </div>
  );
}
