"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
    ChevronLeft, HelpCircle, MessageCircle, Mail, Phone, 
    Search, ExternalLink, ShieldQuestion, LifeBuoy, 
    BookOpen, Sparkles
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function HelpSupport() {
    const { t } = useLanguage();
    const router = useRouter();

    const faqs = [
        { q: t("faq_q1"), a: t("faq_a1") },
        { q: t("faq_q2"), a: t("faq_a2") },
        { q: t("faq_q3"), a: t("faq_a3") },
        { q: t("faq_q4"), a: t("faq_a4") },
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header */}
            <header className="sticky top-0 z-40 w-full bg-white/70 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.back()}
                            className="p-2.5 bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50 rounded-2xl transition-all shadow-sm"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t("help_support")}</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-12">
                {/* Hero Section */}
                <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 sm:p-12 text-center">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-teal-500/20 rounded-full blur-[100px]" />
                    <div className="relative z-10 space-y-6">
                        <div className="inline-flex p-4 bg-white/10 border border-white/20 rounded-3xl backdrop-blur-md">
                            <LifeBuoy className="w-8 h-8 text-teal-400" />
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{t("help_subtitle")}</h2>
                        <div className="max-w-xl mx-auto relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-400 transition-colors" />
                            <input 
                                type="text" 
                                placeholder={t("search_help_placeholder")}
                                className="w-full h-14 pl-14 pr-6 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:bg-white/10 focus:border-teal-500/50 outline-none transition-all"
                            />
                        </div>
                    </div>
                </section>

                {/* Contact Cards */}
                <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <ContactCard 
                        icon={<Mail className="w-6 h-6" />}
                        title={t("contact_email")}
                        desc="support@yourhome.com"
                        color="bg-blue-50 text-blue-600"
                    />
                    <ContactCard 
                        icon={<MessageCircle className="w-6 h-6" />}
                        title={t("contact_chat")}
                        desc={t("avg_response_time")}
                        color="bg-teal-50 text-teal-600"
                    />
                    <ContactCard 
                        icon={<Phone className="w-6 h-6" />}
                        title={t("contact_call")}
                        desc="+1 (555) 000-0000"
                        color="bg-indigo-50 text-indigo-600"
                    />
                </section>

                {/* FAQ Section */}
                <section className="space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-900 rounded-xl text-white">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t("faq_title")}</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="group bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                                <h4 className="text-lg font-bold text-slate-900 mb-3 flex items-center justify-between">
                                    {faq.q}
                                    <Sparkles className="w-4 h-4 text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </h4>
                                <p className="text-slate-600 font-medium leading-relaxed">
                                    {faq.a}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Bottom CTA */}
                <section className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-8 text-center">
                    <p className="text-slate-500 font-bold mb-4">{t("still_need_help")}</p>
                    <button 
                        onClick={() => router.push('/profile/help-support/ticket')}
                        className="px-8 h-12 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 active:scale-95 transition-all"
                    >
                        {t("support_ticket_title")}
                    </button>
                </section>
            </main>
        </div>
    );
}

function ContactCard({ icon, title, desc, color }: { icon: React.ReactNode, title: string, desc: string, color: string }) {
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                {icon}
            </div>
            <h4 className="font-black text-slate-900 mb-1">{title}</h4>
            <p className="text-[13px] font-medium text-slate-500">{desc}</p>
        </div>
    );
}
