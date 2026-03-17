"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  applyDocumentLocale,
  getInitialLocale,
  getLocaleIntl,
  LOCALE_STORAGE_KEY,
  type Locale,
  resolvePreferredLocale,
  translate,
  type TranslationValues,
} from "@/i18n";

export type Language = Locale;

interface LanguageContextType {
  language: Language;
  localeTag: string;
  setLanguage: (language: Language) => void;
  t: (key: string, values?: TranslationValues) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function toDate(value: Date | string | number) {
  return value instanceof Date ? value : new Date(value);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => getInitialLocale());

  useEffect(() => {
    applyDocumentLocale(language);

    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, language);
    } catch {}
  }, [language]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LOCALE_STORAGE_KEY) return;
      const nextLocale = resolvePreferredLocale(event.newValue);
      setLanguageState(nextLocale);
      applyDocumentLocale(nextLocale);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const value = useMemo<LanguageContextType>(() => {
    const localeTag = getLocaleIntl(language);

    return {
      language,
      localeTag,
      setLanguage: (nextLocale) => setLanguageState(resolvePreferredLocale(nextLocale)),
      t: (key, values) => translate(language, key, values),
      formatNumber: (numberValue, options) => new Intl.NumberFormat(localeTag, options).format(numberValue),
      formatDate: (dateValue, options) =>
        new Intl.DateTimeFormat(localeTag, options ?? { day: "2-digit", month: "2-digit", year: "numeric" }).format(toDate(dateValue)),
      formatTime: (dateValue, options) =>
        new Intl.DateTimeFormat(localeTag, options ?? { hour: "2-digit", minute: "2-digit" }).format(toDate(dateValue)),
      formatDateTime: (dateValue, options) =>
        new Intl.DateTimeFormat(
          localeTag,
          options ?? { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }
        ).format(toDate(dateValue)),
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}
