"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, Plus } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/useAuth';
import AddPropertyModal from './AddPropertyModal';
import LoginPromptModal from './LoginPromptModal';

export default function BottomTabBar() {
    const pathname = usePathname();
    const { t } = useLanguage();
    const { user } = useAuth();
    const hideOnRoutes = new Set(['/login', '/register', '/chat']);
    const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
    const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);

    if (hideOnRoutes.has(pathname)) {
        return null;
    }

    return (
        <>
            <div className="h-[75px]" />
            <div className="fixed bottom-0 left-0 right-0 z-[1200] flex h-[70px] items-center border-t border-[var(--theme-border)] bg-[var(--theme-surface)] px-2 backdrop-blur-lg shadow-[0_-8px_20px_rgba(0,0,0,0.05)]">

                {/* Homepage tab */}
                <Link
                    href="/"
                    className="flex-1 flex flex-col items-center justify-center gap-1 transition-all hover:opacity-70"
                >
                    <Home size={22} className={pathname === '/' ? 'text-teal-600' : 'text-[var(--theme-text-muted)]'} />
                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${pathname === '/' ? 'text-teal-600' : 'text-[var(--theme-text-muted)]'}`}>
                        {t('homepage')}
                    </span>
                </Link>

                {/* Center Add Button */}
                <div className="flex-1 flex items-center justify-center relative h-full">
                    <button
                        id="tour-add-btn"
                        className="absolute -top-8 h-[60px] w-[60px] rotate-45 rounded-2xl border-4 border-[var(--theme-surface)] bg-teal-600 text-white shadow-xl shadow-teal-500/40 transition-all outline-none hover:scale-110 hover:bg-teal-700 active:scale-90"
                        onClick={() => {
                            if (!user) {
                                setIsLoginPromptOpen(true);
                            } else {
                                setIsAddPropertyOpen(true);
                            }
                        }}
                    >
                        <div className="-rotate-45">
                            <Plus size={30} strokeWidth={3} />
                        </div>
                    </button>
                    <span className="mt-8 text-[10px] font-black uppercase tracking-widest text-teal-600">
                        {t('post_listing_tab')}
                    </span>
                </div>


                {/* Profile tab */}
                <Link
                    href="/profile"
                    className="flex-1 flex flex-col items-center justify-center gap-1 transition-all hover:opacity-70"
                >
                    <User size={22} className={pathname === '/profile' ? 'text-teal-600' : 'text-[var(--theme-text-muted)]'} />
                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${pathname === '/profile' ? 'text-teal-600' : 'text-[var(--theme-text-muted)]'}`}>
                        {t('profile_tab')}
                    </span>
                </Link>
            </div>

            <AddPropertyModal isOpen={isAddPropertyOpen} onClose={() => setIsAddPropertyOpen(false)} />
            <LoginPromptModal isOpen={isLoginPromptOpen} onClose={() => setIsLoginPromptOpen(false)} />
        </>
    );
}
