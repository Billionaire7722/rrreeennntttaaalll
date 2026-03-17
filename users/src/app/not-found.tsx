"use client";

import Link from "next/link";
import { getInitialLocale, translate } from "@/i18n";

export default function NotFound() {
  const locale = getInitialLocale();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "4rem", fontWeight: 800, color: "#1d4ed8", margin: 0 }}>404</h1>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", marginTop: "1rem" }}>
        {translate(locale, "errors.notFound.title")}
      </h2>
      <p style={{ color: "#6b7280", marginTop: "0.5rem", marginBottom: "2rem" }}>
        {translate(locale, "errors.notFound.description")}
      </p>
      <Link
        href="/"
        style={{
          padding: "0.75rem 1.5rem",
          background: "#2563eb",
          color: "#fff",
          borderRadius: "0.75rem",
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        {translate(locale, "errors.notFound.action")}
      </Link>
    </div>
  );
}
