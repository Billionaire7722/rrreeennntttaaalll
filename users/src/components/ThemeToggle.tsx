"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = "", showLabel = true }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? t("common.switchToLightMode") : t("common.switchToDarkMode")}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2 text-sm font-semibold text-[var(--theme-text)] shadow-[0_10px_30px_rgba(15,23,42,0.10)] transition-all hover:-translate-y-0.5 hover:border-[var(--theme-border-strong)] hover:bg-[var(--theme-surface-2)] ${className}`}
    >
      <span className={`flex h-8 w-8 items-center justify-center rounded-full ${isDark ? "bg-slate-800 text-amber-300" : "bg-amber-100 text-amber-600"}`}>
        {isDark ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
      </span>
      {showLabel ? <span>{isDark ? t("common.darkMode") : t("common.lightMode")}</span> : null}
    </button>
  );
}
