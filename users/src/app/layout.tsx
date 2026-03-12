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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased bg-gray-50`}>
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
