import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import ProvidersLoader from "@/components/ProvidersLoader";
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased bg-[var(--theme-bg)] text-[var(--theme-text)]`}>
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
