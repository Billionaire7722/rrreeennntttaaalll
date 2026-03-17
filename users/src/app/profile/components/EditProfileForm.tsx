"use client";

import { FormEvent } from "react";
import { X, Check, Loader2 } from "lucide-react";

interface EditProfileFormProps {
  firstName: string;
  lastName: string;
  bio: string;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
  setBio: (value: string) => void;
  onSave: (event: FormEvent) => void;
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
  t,
}: EditProfileFormProps) {
  return (
    <div className="rounded-2xl bg-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{t("profile.editProfile")}</h2>
        <button onClick={onCancel} className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      {message.text ? (
        <div
          className={`mb-6 flex items-center gap-3 rounded-xl p-4 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300 ${
            message.type === "success"
              ? "border border-emerald-100/50 bg-emerald-50 text-emerald-700"
              : "border border-red-100/50 bg-red-50 text-red-700"
          }`}
        >
          {message.type === "success" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {message.text}
        </div>
      ) : null}

      <form onSubmit={onSave} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="ml-1 text-sm font-bold text-gray-700">{t("profile.account.lastNameLabel")}</label>
            <input
              type="text"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder={t("auth.register.lastNamePlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-sm font-bold text-gray-700">{t("profile.account.firstNameLabel")}</label>
            <input
              type="text"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder={t("auth.register.firstNamePlaceholder")}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="ml-1 flex items-center justify-between">
            <label className="text-sm font-bold text-gray-700">{t("profile.bio")}</label>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${bio.length > 200 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"}`}>
              {bio.length}/200
            </span>
          </div>
          <textarea
            maxLength={200}
            rows={4}
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm font-medium leading-relaxed outline-none transition-all focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder={t("profile.bioPlaceholder")}
          />
          <p className="ml-1 mt-1 text-[11px] leading-relaxed text-gray-400">{t("profile.changeLimit")}</p>
        </div>

        <div className="flex flex-col gap-3 pt-4 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl bg-gray-100 px-6 py-3 text-sm font-bold text-gray-700 transition-all hover:bg-gray-200"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={isSaving || bio.length > 200}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition-all hover:-translate-y-0.5 hover:bg-teal-700 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("common.saving")}
              </>
            ) : (
              t("common.saveChanges")
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
