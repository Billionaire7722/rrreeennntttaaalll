"use client";

import { Camera, Mail, Pencil, Sparkles } from "lucide-react";
import SafeImage from "@/components/SafeImage";

interface ProfileHeaderProps {
  user: {
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  avatarUrl: string | null;
  coverUrl?: string | null;
  isUploading: boolean;
  onAvatarClick: () => void;
  onEditToggle: () => void;
  t: (key: string) => string;
}

export default function ProfileHeader({
  user,
  avatarUrl,
  coverUrl,
  isUploading,
  onAvatarClick,
  onEditToggle,
  t
}: ProfileHeaderProps) {
  const displayName = [user.lastName, user.firstName].filter(Boolean).join(" ") || user.name || t("common.guest");
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <section className="overflow-hidden rounded-[2rem] border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-[0_25px_80px_rgba(15,23,42,0.14)]">
      <div className="relative">
        <div className="h-28 w-full bg-gradient-to-r from-slate-900 via-teal-900 to-emerald-700 sm:h-36">
          {coverUrl ? (
            <SafeImage
              src={coverUrl}
              alt={displayName}
              className="h-full w-full object-cover opacity-65"
              fallbackSrc="/images/defaultimage.jpg"
            />
          ) : null}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.3),_transparent_35%),linear-gradient(135deg,rgba(15,23,42,0.72),rgba(13,148,136,0.42),rgba(255,255,255,0.08))]" />
        </div>
      </div>

      <div className="relative px-4 pb-5 pt-0 sm:px-6 sm:pb-6">
        <div className="flex flex-col gap-5 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <button
              type="button"
              className="group relative -mt-10 h-24 w-24 shrink-0 overflow-hidden rounded-[1.75rem] border-4 border-[var(--theme-surface)] bg-gradient-to-br from-slate-900 via-teal-700 to-emerald-400 shadow-xl transition-transform hover:scale-[1.02] sm:-mt-14 sm:h-32 sm:w-32"
              onClick={onAvatarClick}
              aria-label={t("profile.editProfile")}
            >
              {avatarUrl ? (
                <SafeImage
                  src={avatarUrl}
                  alt={displayName}
                  className={`h-full w-full object-cover transition-opacity ${isUploading ? "opacity-40" : ""}`}
                  fallbackSrc="/images/defaultimage.jpg"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-black tracking-wide text-white sm:text-3xl">
                  {initials || t("common.guest").slice(0, 1)}
                </span>
              )}

              <span className="absolute inset-0 flex items-center justify-center bg-slate-950/45 opacity-0 transition-opacity group-hover:opacity-100">
                {isUploading ? (
                  <span className="h-7 w-7 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </span>
            </button>

            <div className="min-w-0 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" />
                {t("navigation.profile")}
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl font-black leading-tight text-[var(--theme-text)] sm:text-3xl lg:text-[2rem]">
                  <span className="break-words">{displayName}</span>
                </h1>
                <div className="mt-2 flex items-start gap-2 text-sm text-[var(--theme-text-muted)] sm:text-base">
                  <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--theme-text-muted)]" />
                  <span className="min-w-0 break-all">{user.email}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[220px]">
            <button
              onClick={onEditToggle}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition-all hover:-translate-y-0.5 hover:bg-slate-800"
            >
              <Pencil className="h-4 w-4" />
              {t("profile.editProfile")}
            </button>
            <p className="text-center text-xs leading-5 text-[var(--theme-text-muted)] sm:text-right">
              {t("profile.changeLimit")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
