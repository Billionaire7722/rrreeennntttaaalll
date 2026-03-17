"use client";

import { Heart, Building2, LucideIcon } from "lucide-react";

interface StatItemProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
}

function StatItem({ label, value, icon: Icon, color }: StatItemProps) {
  return (
    <div className="flex flex-col items-center py-6 gap-2 flex-1 border-r last:border-r-0 border-gray-100 transition-colors hover:bg-gray-50/50">
      <div className={`p-2 rounded-xl bg-white shadow-sm border border-gray-100 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">{label}</p>
    </div>
  );
}

interface ProfileStatsProps {
  favoritesCount: number;
  listingsCount: number;
  t: (key: string) => string;
}

export default function ProfileStats({ favoritesCount, listingsCount, t }: ProfileStatsProps) {
  return (
    <div className="flex border-t border-gray-100 bg-gray-50/30">
      <StatItem 
        label={t("saved")} 
        value={favoritesCount} 
        icon={Heart} 
        color="text-rose-500" 
      />
      <StatItem 
        label={t("my_listings")} 
        value={listingsCount} 
        icon={Building2} 
        color="text-teal-500" 
      />
    </div>
  );
}
