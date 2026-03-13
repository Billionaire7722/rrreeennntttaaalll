"use client";

export const dynamic = 'force-dynamic';

import Link from "next/link";
import { ChevronLeft, Shield, Eye, Database, Users, Lock, History, Scale, ExternalLink, Baby, Mail, FileText } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function PrivacyPage() {
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
                    <div className="flex items-center gap-3 text-blue-600 mb-2">
                        <Shield size={32} />
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">{t('privacy_title')}</h1>
                    </div>
                    {t('privacy_updated') && (
                        <p className="text-slate-500 text-sm mb-4 font-medium">{t('privacy_updated')}</p>
                    )}
                    <div className="space-y-4 text-slate-700 leading-7 text-lg">
                        <p className="font-semibold">{t('privacy_welcome')}</p>
                        <p>{t('privacy_intro')}</p>
                        <p>{t('privacy_agreement')}</p>
                    </div>
                </div>

                <div className="mt-6 space-y-6">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((idx) => {
                        const title = t(`privacy_section${idx}_title`);
                        const content = t(`privacy_section${idx}_content`);
                        
                        if (title === `privacy_section${idx}_title`) return null;

                        // Map icons to specific sections
                        let Icon = FileText;
                        if (idx === 1) Icon = Eye;
                        if (idx === 2) Icon = Database;
                        if (idx === 3) Icon = Users;
                        if (idx === 4) Icon = Lock;
                        if (idx === 5) Icon = History;
                        if (idx === 6) Icon = Scale;
                        if (idx === 7) Icon = ExternalLink;
                        if (idx === 8) Icon = Shield; // Baby or Shield
                        if (idx === 10) Icon = Mail;

                        return (
                            <section key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
                                <div className="flex items-center gap-2 text-slate-800 font-bold text-xl mb-4">
                                    <Icon size={20} className="text-blue-500" />
                                    <h2>{title}</h2>
                                </div>
                                <div className="text-slate-700 leading-7 whitespace-pre-wrap">
                                    {content.split('\n').map((line, i) => (
                                        <p key={i} className={i > 0 && line.trim() !== "" ? "mt-2" : ""}>{line}</p>
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

