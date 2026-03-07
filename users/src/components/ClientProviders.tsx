"use client";

import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { LanguageProvider } from "@/context/LanguageContext";
import Navbar from "@/components/Navbar";
import BottomTabBar from "@/components/BottomTabBar";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <LanguageProvider>
            <AuthProvider>
                <SocketProvider>
                    <div className="flex flex-col min-h-screen w-full relative bg-white">
                        {children}
                        <BottomTabBar />
                    </div>
                </SocketProvider>
            </AuthProvider>
        </LanguageProvider>
    );
}
