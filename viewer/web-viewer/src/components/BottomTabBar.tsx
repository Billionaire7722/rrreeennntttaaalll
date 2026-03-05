"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, User } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function BottomTabBar() {
    const pathname = usePathname();
    const { t } = useLanguage();
    const hideOnRoutes = new Set(['/login', '/register']);

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
            <div className="fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur border-t border-gray-200 flex justify-around items-center h-[60px] z-[1200] shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = pathname === tab.href;
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className="flex flex-col items-center justify-center w-full h-full"
                        >
                            <Icon size={24} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                            <span className={`text-[11px] font-semibold mt-1 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                                {tab.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </>
    );
}
