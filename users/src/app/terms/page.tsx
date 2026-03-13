"use client";

export const dynamic = 'force-dynamic';

import Link from "next/link";
import { ChevronLeft, ShieldCheck, FileText, Lock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function TermsPage() {
    const { t } = useLanguage();

    return (
        <div className="h-full overflow-y-auto bg-slate-100 text-slate-900 pb-28">
            <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
                <div className="mb-6">
                    <Link 
                        href="/register" 
                        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
                    >
                        <ChevronLeft size={16} />
                        <span>{t('go_back')}</span>
                    </Link>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-10">
                    <div className="flex items-center gap-3 text-teal-600 mb-2">
                        <ShieldCheck size={32} />
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">{t('terms_title')}</h1>
                    </div>
                    {t('terms_updated') && (
                        <p className="text-slate-500 text-sm mb-4 font-medium">{t('terms_updated')}</p>
                    )}
                    <p className="mt-4 text-slate-700 leading-7 text-lg">{t('terms_intro')}</p>
                </div>

                <div className="mt-6 space-y-6">
                    {Array.from({ length: 16 }, (_, i) => i + 1).map((idx) => {
                        const title = t(`terms_section${idx}_title`);
                        const content = t(`terms_section${idx}_content`);
                        
                        // If title is the key itself, it means the translation is missing for this lang
                        if (title === `terms_section${idx}_title`) return null;

                        // Map icons to specific sections
                        let Icon = FileText;
                        if (idx === 2) Icon = ShieldCheck;
                        if (idx === 3) Icon = Lock;
                        if (idx === 10) Icon = ShieldCheck;
                        if (idx === 16) Icon = ShieldCheck;

                        return (
                            <section key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
                                <div className="flex items-center gap-2 text-slate-800 font-bold text-xl mb-4">
                                    <Icon size={20} className="text-teal-500" />
                                    <h2>{title}</h2>
                                </div>
                                <div className="text-slate-700 leading-7 whitespace-pre-wrap">
                                    {content.split('\n').map((line, i) => (
                                        <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>

                <div className="mt-12 text-center text-slate-500 text-sm">
                    <p>© {new Date().getFullYear()} YourHome. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}
