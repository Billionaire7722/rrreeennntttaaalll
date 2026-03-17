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
            <div className="h-[88px]" />
            <div className="fixed bottom-0 left-0 right-0 z-[1200]" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
                <div className="relative mx-auto h-[78px] w-full max-w-screen-2xl border-t border-[var(--theme-border)] bg-[var(--theme-surface)] px-2 backdrop-blur-lg shadow-[0_-8px_20px_rgba(0,0,0,0.05)]">
                    <div className="pointer-events-none absolute inset-x-0 -top-8 flex justify-center">
                        <button
                            id="tour-add-btn"
                            className="pointer-events-auto flex h-[60px] w-[60px] items-center justify-center rounded-2xl border-4 border-[var(--theme-surface)] bg-teal-600 text-white shadow-xl shadow-teal-500/40 transition-all outline-none hover:scale-110 hover:bg-teal-700 active:scale-90"
                            onClick={() => {
                                if (!user) {
                                    setIsLoginPromptOpen(true);
                                } else {
                                    setIsAddPropertyOpen(true);
                                }
                            }}
                        >
                            <Plus size={30} strokeWidth={3} />
                        </button>
                    </div>
                    <div className="flex h-full items-center">

                        {/* Homepage tab */}
                        <Link
                            href="/"
                            className="flex flex-1 flex-col items-center justify-center gap-1 transition-all hover:opacity-70"
                        >
                            <Home size={22} className={pathname === '/' ? 'text-teal-600' : 'text-[var(--theme-text-muted)]'} />
                            <span className={`text-[10px] font-bold uppercase tracking-tighter ${pathname === '/' ? 'text-teal-600' : 'text-[var(--theme-text-muted)]'}`}>
                                {t('navigation.home')}
                            </span>
                        </Link>

                        <div className="flex flex-1 flex-col items-center justify-end pb-2">
                            <span className="mt-8 text-[10px] font-black uppercase tracking-widest text-teal-600">
                                {t('navigation.postListing')}
                            </span>
                        </div>


                        {/* Profile tab */}
                        <Link
                            href="/profile"
                            className="flex flex-1 flex-col items-center justify-center gap-1 transition-all hover:opacity-70"
                        >
                            <User size={22} className={pathname === '/profile' ? 'text-teal-600' : 'text-[var(--theme-text-muted)]'} />
                            <span className={`text-[10px] font-bold uppercase tracking-tighter ${pathname === '/profile' ? 'text-teal-600' : 'text-[var(--theme-text-muted)]'}`}>
                                {t('navigation.profile')}
                            </span>
                        </Link>
                    </div>
                </div>
            </div>

            <AddPropertyModal isOpen={isAddPropertyOpen} onClose={() => setIsAddPropertyOpen(false)} />
            <LoginPromptModal isOpen={isLoginPromptOpen} onClose={() => setIsLoginPromptOpen(false)} />
        </>
    );
}
