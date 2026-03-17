"use client";

import { Building2, Heart, LucideIcon, MessageCircle } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: string;
}

function StatCard({ label, value, icon: Icon, accent }: StatCardProps) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 text-left shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--theme-text-muted)]">{label}</p>
          <p className="mt-3 text-3xl font-black text-[var(--theme-text)]">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

interface ProfileStatsProps {
  favoritesCount: number;
  listingsCount: number;
  chatsCount: number;
  t: (key: string) => string;
}

export default function ProfileStats({
  favoritesCount,
  listingsCount,
  chatsCount,
  t,
}: ProfileStatsProps) {
  return (
    <section className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--theme-text-muted)]">
          {t("navigation.profile")}
        </p>
        <h2 className="mt-1 text-lg font-bold text-[var(--theme-text)]">
          {t("profile.summaryTitle")}
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
        <StatCard
          label={t("navigation.saved")}
          value={favoritesCount}
          icon={Heart}
          accent="bg-rose-50 text-rose-500"
        />
        <StatCard
          label={t("navigation.myProperties")}
          value={listingsCount}
          icon={Building2}
          accent="bg-amber-50 text-amber-600"
        />
        <StatCard
          label={t("navigation.chats")}
          value={chatsCount}
          icon={MessageCircle}
          accent="bg-emerald-50 text-emerald-600"
        />
      </div>
    </section>
  );
}
