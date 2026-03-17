"use client";

import { Building2, Heart, LucideIcon, MessageCircle } from "lucide-react";

type ProfileTabKey = "favorites" | "my-properties" | "messages";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: string;
  active: boolean;
  onClick: () => void;
}

function StatCard({ label, value, icon: Icon, accent, active, onClick }: StatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-[1.5rem] border p-4 text-left transition-all ${
        active
          ? "border-slate-900 bg-slate-900 text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]"
          : "border-white/70 bg-white/90 text-slate-900 shadow-[0_18px_60px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:border-teal-100"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${active ? "text-white/70" : "text-slate-400"}`}>
            {label}
          </p>
          <p className={`mt-3 text-3xl font-black ${active ? "text-white" : "text-slate-900"}`}>{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${active ? "bg-white/12 text-white" : accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </button>
  );
}

interface ProfileStatsProps {
  favoritesCount: number;
  listingsCount: number;
  chatsCount: number;
  activeTab: ProfileTabKey;
  onTabSelect: (tab: ProfileTabKey) => void;
  t: (key: string) => string;
}

export default function ProfileStats({
  favoritesCount,
  listingsCount,
  chatsCount,
  activeTab,
  onTabSelect,
  t,
}: ProfileStatsProps) {
  return (
    <section className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          {t("profile_tab")}
        </p>
        <h2 className="mt-1 text-lg font-bold text-slate-900">
          {t("settings") || "Summary"}
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
        <StatCard
          label={t("saved")}
          value={favoritesCount}
          icon={Heart}
          accent="bg-rose-50 text-rose-500"
          active={activeTab === "favorites"}
          onClick={() => onTabSelect("favorites")}
        />
        <StatCard
          label={t("my_listings")}
          value={listingsCount}
          icon={Building2}
          accent="bg-amber-50 text-amber-600"
          active={activeTab === "my-properties"}
          onClick={() => onTabSelect("my-properties")}
        />
        <StatCard
          label={t("chats")}
          value={chatsCount}
          icon={MessageCircle}
          accent="bg-emerald-50 text-emerald-600"
          active={activeTab === "messages"}
          onClick={() => onTabSelect("messages")}
        />
      </div>
    </section>
  );
}
