import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import ProvidersLoader from "@/components/ProvidersLoader";
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, SUPPORTED_LOCALES } from "@/i18n";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "YourHome",
  description: "Find your perfect home",
  icons: {
    icon: "/assets/images/greenapple.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const localeInitScript = `
    (() => {
      try {
        const key = ${JSON.stringify(LOCALE_STORAGE_KEY)};
        const supported = new Set(${JSON.stringify([...SUPPORTED_LOCALES])});
        const fallback = ${JSON.stringify(DEFAULT_LOCALE)};
        const normalize = (value) => {
          if (!value) return fallback;
          const normalized = String(value).trim().replace(/_/g, '-');
          const lower = normalized.toLowerCase();
          if (supported.has(normalized)) return normalized;
          if (lower === 'zh' || lower === 'zh-cn' || lower === 'zh-hans') return 'zh-CN';
          if (lower === 'zh-tw' || lower === 'zh-hk' || lower === 'zh-mo' || lower === 'zh-hant') return 'zh-TW';
          const base = lower.split('-')[0];
          const supportedByBase = Array.from(supported).find((locale) => locale.toLowerCase() === base);
          if (supportedByBase) return supportedByBase;
          return fallback;
        };
        const rawStored = localStorage.getItem(key);
        const stored = rawStored ? normalize(rawStored) : '';
        const browser = normalize(navigator.language || navigator.languages?.[0]);
        const locale = stored || browser || fallback;
        document.documentElement.lang = locale;
        document.documentElement.dataset.locale = locale;
      } catch {
        document.documentElement.lang = ${JSON.stringify(DEFAULT_LOCALE)};
        document.documentElement.dataset.locale = ${JSON.stringify(DEFAULT_LOCALE)};
      }
    })();
  `;

  const themeInitScript = `
    (() => {
      try {
        const key = 'rental-theme';
        const saved = localStorage.getItem(key);
        const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const theme = saved === 'light' || saved === 'dark' ? saved : system;
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;
      } catch {}
    })();
  `;

  return (
    <html lang={DEFAULT_LOCALE} suppressHydrationWarning>
      <body className={`${inter.variable} antialiased bg-[var(--theme-bg)] text-[var(--theme-text)]`}>
        <script dangerouslySetInnerHTML={{ __html: localeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
          defer
          strategy="afterInteractive"
        />
        <ProvidersLoader>{children}</ProvidersLoader>
      </body>
    </html>
  );
}
