"use client";

import React, { useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, User, Plus } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/useAuth';
import AddPropertyModal from './AddPropertyModal';

export default function BottomTabBar() {
    const pathname = usePathname();
    const { t } = useLanguage();
    const { user } = useAuth();
    const hideOnRoutes = new Set(['/login', '/register', '/chat']);
    const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);

    if (hideOnRoutes.has(pathname)) {
        return null;
    }

    const tabs = [
        { name: t("map"), href: '/', icon: Map },
        { name: t("profile"), href: '/profile', icon: User },
    ];

    return (
        <>
            <div className="h-[60px]" />
            <div className="fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur border-t border-gray-200 flex items-center h-[60px] z-[1200] shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
                {/* Map tab - left */}
                <Link
                    href="/"
                    className="flex-1 flex items-center justify-center h-full"
                >
                    <Map size={26} className={pathname === '/' ? 'text-blue-600' : 'text-gray-400'} />
                </Link>

                {/* Center Add Button */}
                <div className="flex-1 flex items-center justify-center relative">
                    <button
                        className="absolute -top-6 bg-blue-600 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all outline-none"
                        onClick={() => {
                            if (!user) {
                                alert("Please log in to add a property");
                            } else {
                                setIsAddPropertyOpen(true);
                            }
                        }}
                    >
                        <Plus size={28} />
                    </button>
                </div>

                {/* Profile tab - right */}
                <Link
                    href="/profile"
                    className="flex-1 flex items-center justify-center h-full"
                >
                    <User size={26} className={pathname === '/profile' ? 'text-blue-600' : 'text-gray-400'} />
                </Link>
            </div>

            <AddPropertyModal isOpen={isAddPropertyOpen} onClose={() => setIsAddPropertyOpen(false)} />
        </>
    );
}
