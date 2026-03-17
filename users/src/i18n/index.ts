import en from "@/i18n/locales/en.json";
import es from "@/i18n/locales/es.json";
import fr from "@/i18n/locales/fr.json";
import id from "@/i18n/locales/id.json";
import ja from "@/i18n/locales/ja.json";
import ko from "@/i18n/locales/ko.json";
import th from "@/i18n/locales/th.json";
import vi from "@/i18n/locales/vi.json";
import zhCN from "@/i18n/locales/zh-CN.json";
import zhTW from "@/i18n/locales/zh-TW.json";
import legacyKeyMap from "@/i18n/legacyKeyMap.json";

export const LOCALE_STORAGE_KEY = "app_lang";
export const DEFAULT_LOCALE = "en";

export const SUPPORTED_LOCALES = [
  "vi",
  "en",
  "es",
  "zh-CN",
  "zh-TW",
  "fr",
  "ko",
  "ja",
  "th",
  "id",
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_METADATA: Record<
  Locale,
  { label: string; nativeLabel: string; intl: string; flagUrl: string }
> = {
  vi: { label: "Vietnamese", nativeLabel: "Tieng Viet", intl: "vi-VN", flagUrl: "https://flagcdn.com/w20/vn.png" },
  en: { label: "English", nativeLabel: "English", intl: "en-US", flagUrl: "https://flagcdn.com/w20/gb.png" },
  es: { label: "Spanish", nativeLabel: "Espanol", intl: "es-ES", flagUrl: "https://flagcdn.com/w20/es.png" },
  "zh-CN": { label: "Simplified Chinese", nativeLabel: "\u7b80\u4f53\u4e2d\u6587", intl: "zh-CN", flagUrl: "https://flagcdn.com/w20/cn.png" },
  "zh-TW": { label: "Traditional Chinese", nativeLabel: "\u7e41\u9ad4\u4e2d\u6587", intl: "zh-TW", flagUrl: "https://flagcdn.com/w20/tw.png" },
  fr: { label: "French", nativeLabel: "Francais", intl: "fr-FR", flagUrl: "https://flagcdn.com/w20/fr.png" },
  ko: { label: "Korean", nativeLabel: "\ud55c\uad6d\uc5b4", intl: "ko-KR", flagUrl: "https://flagcdn.com/w20/kr.png" },
  ja: { label: "Japanese", nativeLabel: "\u65e5\u672c\u8a9e", intl: "ja-JP", flagUrl: "https://flagcdn.com/w20/jp.png" },
  th: { label: "Thai", nativeLabel: "\u0e44\u0e17\u0e22", intl: "th-TH", flagUrl: "https://flagcdn.com/w20/th.png" },
  id: { label: "Indonesian", nativeLabel: "Bahasa Indonesia", intl: "id-ID", flagUrl: "https://flagcdn.com/w20/id.png" },
};

export const MESSAGES = {
  vi,
  en,
  es,
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  fr,
  ko,
  ja,
  th,
  id,
} as const;

export type MessageTree = typeof en;

type DotPrefix<TPrefix extends string, TValue extends string> = TValue extends "" ? TPrefix : `${TPrefix}.${TValue}`;

export type TranslationKey<TValue = MessageTree> = TValue extends string
  ? ""
  : {
      [TKey in keyof TValue & string]: TValue[TKey] extends string
        ? TKey
        : DotPrefix<TKey, TranslationKey<TValue[TKey]>>;
    }[keyof TValue & string];

export type TranslationValues = Record<string, string | number | null | undefined>;

const PROPERTY_TYPE_DEFINITIONS = {
  house: {
    apiValue: "house",
    aliases: ["house"],
    translationKey: "property.types.house",
  },
  commercialSpace: {
    apiValue: "commercial space",
    aliases: ["commercial space", "commercial_space", "commercialspace"],
    translationKey: "property.types.commercialSpace",
  },
  apartment: {
    apiValue: "apartment",
    aliases: ["apartment"],
    translationKey: "property.types.apartment",
  },
  condominium: {
    apiValue: "condominium",
    aliases: ["condominium", "condo"],
    translationKey: "property.types.condominium",
  },
  hotel: {
    apiValue: "hotel",
    aliases: ["hotel"],
    translationKey: "property.types.hotel",
  },
} as const;

const PROPERTY_STATUS_TRANSLATION_KEYS = {
  available: "property.status.available",
  rented: "property.status.rented",
  pending: "property.status.pending",
} as const;

export type PropertyTypeId = keyof typeof PROPERTY_TYPE_DEFINITIONS;
export type PropertyStatusId = keyof typeof PROPERTY_STATUS_TRANSLATION_KEYS;

export const PROPERTY_TYPE_OPTIONS = (Object.entries(PROPERTY_TYPE_DEFINITIONS) as Array<
  [PropertyTypeId, (typeof PROPERTY_TYPE_DEFINITIONS)[PropertyTypeId]]
>).map(([id, definition]) => ({
  id,
  apiValue: definition.apiValue,
  translationKey: definition.translationKey as TranslationKey,
}));

function isSupportedLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export function normalizeLocale(value?: string | null): Locale {
  if (!value) return DEFAULT_LOCALE;

  const normalized = value.trim().replace(/_/g, "-");
  const lower = normalized.toLowerCase();

  if (isSupportedLocale(normalized)) return normalized;
  if (lower === "zh" || lower === "zh-cn" || lower === "zh-hans") return "zh-CN";
  if (lower === "zh-tw" || lower === "zh-hk" || lower === "zh-mo" || lower === "zh-hant") return "zh-TW";

  const base = lower.split("-")[0];
  if (base === "zh") return lower.includes("tw") || lower.includes("hk") || lower.includes("mo") ? "zh-TW" : "zh-CN";

  const matchedBase = SUPPORTED_LOCALES.find((locale) => locale.toLowerCase() === base);
  return matchedBase ?? DEFAULT_LOCALE;
}

export function resolvePreferredLocale(value?: string | null): Locale {
  return normalizeLocale(value);
}

function getBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const candidates = [navigator.language, ...(navigator.languages ?? [])];

  for (const candidate of candidates) {
    const locale = normalizeLocale(candidate);
    if (locale) return locale;
  }

  return DEFAULT_LOCALE;
}

export function getInitialLocale(): Locale {
  if (typeof document !== "undefined") {
    const domLocale = document.documentElement.dataset.locale || document.documentElement.lang;
    if (domLocale) return normalizeLocale(domLocale);
  }

  if (typeof window !== "undefined") {
    try {
      const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      return storedLocale ? normalizeLocale(storedLocale) : getBrowserLocale();
    } catch {
      return getBrowserLocale();
    }
  }

  return DEFAULT_LOCALE;
}

export function getLocaleIntl(locale: Locale): string {
  return LOCALE_METADATA[locale].intl;
}

export function resolveTranslationPath(key: string): string {
  if (key.includes(".")) return key;
  return legacyKeyMap[key as keyof typeof legacyKeyMap] ?? key;
}

function getMessageAtPath(messages: unknown, key: string): string | undefined {
  return key.split(".").reduce<unknown>((currentValue, currentPart) => {
    if (currentValue == null) return undefined;

    if (Array.isArray(currentValue)) {
      const index = Number(currentPart);
      return Number.isFinite(index) ? currentValue[index] : undefined;
    }

    if (typeof currentValue === "object" && currentPart in (currentValue as Record<string, unknown>)) {
      return (currentValue as Record<string, unknown>)[currentPart];
    }

    return undefined;
  }, messages) as string | undefined;
}

export function interpolateMessage(message: string, values?: TranslationValues): string {
  if (!values) return message;

  return message.replace(/\{(\w+)\}/g, (_, token) => {
    const value = values[token];
    return value == null ? "" : String(value);
  });
}

export function translate(locale: Locale, key: string, values?: TranslationValues): string {
  const path = resolveTranslationPath(key);
  const localized = getMessageAtPath(MESSAGES[locale], path);
  const fallback = getMessageAtPath(MESSAGES[DEFAULT_LOCALE], path);
  const resolved = localized ?? fallback ?? "";

  if (!resolved && process.env.NODE_ENV !== "production") {
    console.warn(`[i18n] Missing translation for key: ${key} -> ${path}`);
  }

  return interpolateMessage(resolved, values);
}

function normalizeIdentifier(value?: string | null) {
  return value == null ? "" : value.trim().toLowerCase().replace(/[-\s]+/g, "_");
}

export function normalizePropertyType(value?: string | null): PropertyTypeId | null {
  const normalized = normalizeIdentifier(value);
  if (!normalized) return null;

  for (const [id, definition] of Object.entries(PROPERTY_TYPE_DEFINITIONS) as Array<
    [PropertyTypeId, (typeof PROPERTY_TYPE_DEFINITIONS)[PropertyTypeId]]
  >) {
    if (definition.aliases.some((alias) => normalizeIdentifier(alias) === normalized)) return id;
  }

  return null;
}

export function getPropertyTypeTranslationKey(value?: string | null): TranslationKey | null {
  const propertyType = normalizePropertyType(value);
  return propertyType ? (PROPERTY_TYPE_DEFINITIONS[propertyType].translationKey as TranslationKey) : null;
}

export function toPropertyTypeApiValue(value?: string | null): string {
  const propertyType = normalizePropertyType(value);
  return propertyType ? PROPERTY_TYPE_DEFINITIONS[propertyType].apiValue : value ?? "";
}

export function normalizePropertyStatus(value?: string | null): PropertyStatusId | null {
  const normalized = normalizeIdentifier(value);
  if (!normalized) return null;
  if (normalized === "available") return "available";
  if (normalized === "rented") return "rented";
  if (normalized === "pending") return "pending";
  return null;
}

export function getPropertyStatusTranslationKey(value?: string | null): TranslationKey | null {
  const status = normalizePropertyStatus(value);
  return status ? (PROPERTY_STATUS_TRANSLATION_KEYS[status] as TranslationKey) : null;
}

export function applyDocumentLocale(locale: Locale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
  document.documentElement.dataset.locale = locale;
}
