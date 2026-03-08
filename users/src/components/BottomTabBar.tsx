"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, User, Plus } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/useAuth';
import api from '@/api/axios';
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

    return (
        <>
            <div className="h-[75px]" />
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 flex items-center h-[70px] z-[1200] shadow-[0_-8px_20px_rgba(0,0,0,0.05)] px-2">

                {/* Map tab */}
                <Link
                    href="/"
                    className="flex-1 flex flex-col items-center justify-center gap-1 transition-all hover:opacity-70"
                >
                    <Map size={22} className={pathname === '/map' ? 'text-teal-600' : 'text-gray-400'} />
                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${pathname === '/map' ? 'text-teal-600' : 'text-gray-400'}`}>Map</span>
                </Link>

                {/* Center Add Button */}
                <div className="flex-1 flex items-center justify-center relative h-full">
                    <button
                        id="tour-add-btn"
                        className="absolute -top-8 bg-teal-600 w-15 h-15 w-[60px] h-[60px] rounded-2xl rotate-45 flex items-center justify-center text-white shadow-xl shadow-teal-500/40 hover:bg-teal-700 hover:scale-110 active:scale-90 transition-all outline-none border-4 border-white"
                        onClick={() => {
                            if (!user) {
                                alert("Please log in to add a property");
                            } else {
                                setIsAddPropertyOpen(true);
                            }
                        }}
                    >
                        <div className="-rotate-45">
                            <Plus size={30} strokeWidth={3} />
                        </div>
                    </button>
                    <span className="mt-8 text-[10px] font-black text-teal-600 uppercase tracking-widest">Đăng tin</span>
                </div>


                {/* Profile tab */}
                <Link
                    href="/profile"
                    className="flex-1 flex flex-col items-center justify-center gap-1 transition-all hover:opacity-70"
                >
                    <User size={22} className={pathname === '/profile' ? 'text-teal-600' : 'text-gray-400'} />
                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${pathname === '/profile' ? 'text-teal-600' : 'text-gray-400'}`}>Tôi</span>
                </Link>
            </div>

            <AddPropertyModal isOpen={isAddPropertyOpen} onClose={() => setIsAddPropertyOpen(false)} />
        </>
    );
}
