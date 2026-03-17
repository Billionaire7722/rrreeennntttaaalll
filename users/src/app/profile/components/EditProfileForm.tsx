"use client";

import { X, Check, Loader2 } from "lucide-react";
import { FormEvent } from "react";

interface EditProfileFormProps {
  firstName: string;
  lastName: string;
  bio: string;
  setFirstName: (val: string) => void;
  setLastName: (val: string) => void;
  setBio: (val: string) => void;
  onSave: (e: FormEvent) => void;
  onCancel: () => void;
  isSaving: boolean;
  message: { type: string; text: string };
  t: (key: string) => string;
}

export default function EditProfileForm({
  firstName,
  lastName,
  bio,
  setFirstName,
  setLastName,
  setBio,
  onSave,
  onCancel,
  isSaving,
  message,
  t
}: EditProfileFormProps) {
  return (
    <div className="p-6 bg-white rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">{t("edit_profile") || "Chỉnh sửa hồ sơ"}</h2>
        <button 
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' 
            : 'bg-red-50 text-red-700 border border-red-100/50'
        }`}>
          {message.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      <form onSubmit={onSave} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">{t("last_name") || "Họ"}</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm font-medium"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Last name"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">{t("first_name") || "Tên"}</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm font-medium"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="First name"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center ml-1">
            <label className="text-sm font-bold text-gray-700">{t("bio") || "Giới thiệu"}</label>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              bio.length > 200 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
            }`}>
              {bio.length}/200
            </span>
          </div>
          <textarea
            maxLength={200}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm font-medium resize-none leading-relaxed"
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder={t("bio_placeholder") || "Giới thiệu ngắn gọn về bản thân..."}
          />
          <p className="text-[11px] text-gray-400 mt-1 ml-1 leading-relaxed">
            {t("change_limit") || "Bạn có thể thay đổi họ tên tối đa 1 lần mỗi 30 ngày."}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all text-sm"
          >
            {t("cancel") || "Hủy"}
          </button>
          <button
            type="submit"
            disabled={isSaving || bio.length > 200}
            className="flex-1 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("saving") || "Đang lưu..."}
              </>
            ) : (
              t("save_changes") || "Lưu thay đổi"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
