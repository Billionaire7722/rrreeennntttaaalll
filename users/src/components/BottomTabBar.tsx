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
            <div className="fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur border-t border-gray-200 flex justify-between items-center h-[60px] z-[1200] shadow-[0_-2px_12px_rgba(0,0,0,0.08)] px-6">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = pathname === tab.href;
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className="flex flex-col items-center justify-center w-16 h-full"
                        >
                            <Icon size={24} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                            <span className={`text-[11px] font-semibold mt-1 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                                {tab.name}
                            </span>
                        </Link>
                    );
                })}

                {/* Center Add Button */}
                <button
                    className="absolute left-[50%] -translate-x-1/2 -top-6 bg-blue-600 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all outline-none"
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

            <AddPropertyModal isOpen={isAddPropertyOpen} onClose={() => setIsAddPropertyOpen(false)} />
        </>
    );
}
