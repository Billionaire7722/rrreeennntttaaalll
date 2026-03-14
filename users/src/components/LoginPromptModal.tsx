"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, LogIn, UserPlus } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface LoginPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LoginPromptModal({ isOpen, onClose }: LoginPromptModalProps) {
    const { t } = useLanguage();
    const router = useRouter();

    if (!isOpen) return null;

    const handleLogin = () => {
        router.push('/login');
        onClose();
    };

    const handleRegister = () => {
        router.push('/register');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-md px-4 transition-all animate-in fade-in duration-300">
            <div 
                className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative transform transition-all animate-in zoom-in-95 slide-in-from-bottom-10 duration-500"
            >
                {/* Decorative Background */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-teal-600 to-teal-400 opacity-10" />
                
                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all z-10"
                >
                    <X size={20} />
                </button>

                <div className="px-8 pt-10 pb-8 flex flex-col items-center text-center relative">
                    {/* Icon Container */}
                    <div className="w-20 h-20 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-teal-100/50">
                        <LogIn size={36} className="text-teal-600" />
                    </div>

                    <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
                        {t('login_prompt_title')}
                    </h2>
                    
                    <p className="text-gray-500 text-sm leading-relaxed mb-8">
                        {t('login_prompt_desc')}
                    </p>

                    <div className="w-full space-y-3">
                        <button 
                            onClick={handleLogin}
                            className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-teal-600/20 active:scale-[0.98]"
                        >
                            <LogIn size={18} />
                            {t('sign_in_btn')}
                        </button>
                        
                        <button 
                            onClick={handleRegister}
                            className="w-full flex items-center justify-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-700 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98]"
                        >
                            <UserPlus size={18} />
                            {t('create_account_btn')}
                        </button>

                        <button 
                            onClick={onClose}
                            className="w-full py-3 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {t('cancel')}
                        </button>
                    </div>
                </div>
                
                {/* Bottom Accent */}
                <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 to-teal-400" />
            </div>
        </div>
    );
}
