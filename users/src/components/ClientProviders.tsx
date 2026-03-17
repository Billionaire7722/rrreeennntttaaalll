"use client";

import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import BottomTabBar from "@/components/BottomTabBar";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <AuthProvider>
                    <SocketProvider>
                        <div className="theme-shell flex min-h-screen w-full flex-col relative bg-[var(--theme-bg)] text-[var(--theme-text)]">
                            {children}
                            <BottomTabBar />
                        </div>
                    </SocketProvider>
                </AuthProvider>
            </LanguageProvider>
        </ThemeProvider>
    );
}
