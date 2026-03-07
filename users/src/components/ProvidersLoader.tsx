"use client";

import loadDynamic from "next/dynamic";
import type { ReactNode } from "react";

// Dynamic import with ssr:false is allowed in Client Components
const ClientProviders = loadDynamic(() => import("./ClientProviders"), {
    ssr: false,
    loading: () => null,
});

export default function ProvidersLoader({ children }: { children: ReactNode }) {
    return <ClientProviders>{children}</ClientProviders>;
}
