"use client";

export const dynamic = 'force-dynamic';

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Users, Briefcase, Target, Building2, ChevronLeft } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function AboutPage() {
    const { t } = useLanguage();
    const router = useRouter();

    const productItems = [
        t("about_product_item1"),
        t("about_product_item2"),
        t("about_product_item3"),
        t("about_product_item4"),
        t("about_product_item5"),
    ];

    return (
        <div className="h-full overflow-y-auto bg-slate-100 text-slate-900 pb-28">
            {/* Premium Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-5xl mx-auto px-4 h-16 sm:h-20 flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="p-2.5 bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50 rounded-2xl transition-all shadow-sm"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {t("about_us")}
                    </h2>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
                {/* Hero Section */}
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 md:p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 -z-0" />
                    <div className="relative z-10">
                        <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider mb-4 border border-slate-200">
                            {t("about_us")}
                        </span>
                        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                            {t("about_title")}
                        </h1>
                        <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-3xl">
                            {t("about_intro")}
                        </p>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="mt-8 grid gap-6 md:grid-cols-2">
                    {/* Founder Section */}
                    <section className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-md transition-shadow duration-300">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                            <Users size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">{t("about_founder_title")}</h2>
                        <div className="space-y-4">
                            <p className="text-slate-600 leading-relaxed">
                                <span className="font-semibold text-slate-900">{t("about_founder_name_label")}:</span> {t("about_founder_name")}.
                            </p>
                            <p className="text-slate-600 leading-relaxed italic border-l-4 border-slate-100 pl-4">
                                "{t("about_founder_desc")}"
                            </p>
                        </div>
                    </section>

                    {/* Hiring Section */}
                    <section className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-md transition-shadow duration-300">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                            <Briefcase size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">{t("about_hiring_title")}</h2>
                        <div className="space-y-4 text-slate-600 leading-relaxed">
                            <p>{t("about_hiring_desc1")}</p>
                            <p className="bg-slate-50 p-4 rounded-xl text-sm font-medium border border-slate-100">
                                {t("about_hiring_desc2")}
                            </p>
                        </div>
                    </section>

                    {/* Product Capability */}
                    <section className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-md transition-shadow duration-300">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6">
                            <Building2 size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">{t("about_product_title")}</h2>
                        <ul className="space-y-3">
                            {productItems.map((item, idx) => (
                                <li key={idx} className="flex gap-3 text-slate-600 leading-relaxed">
                                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-purple-400 mt-2.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Mission Section */}
                    <section className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-md transition-shadow duration-300">
                        <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-6">
                            <Target size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">{t("about_mission_title")}</h2>
                        <div className="space-y-4 text-slate-600 leading-relaxed">
                            <p>{t("about_mission_desc1")}</p>
                            <p className="font-medium text-slate-800 border-t border-slate-50 pt-4">
                                {t("about_mission_desc2")}
                            </p>
                        </div>
                    </section>
                </div>

                {/* Contact CTA */}
                <section className="mt-8 bg-slate-900 text-slate-100 rounded-3xl p-8 md:p-12 relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -mb-48 -mr-48 blur-3xl" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="max-w-xl">
                            <div className="flex items-center gap-3 font-bold text-blue-400 mb-4">
                                <Mail size={20} />
                                <span className="uppercase tracking-widest text-xs">{t("about_contact_title")}</span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold mb-4">{t("about_contact_title")}</h2>
                            <p className="text-slate-400 leading-relaxed text-lg">
                                {t("about_contact_desc")}
                            </p>
                        </div>
                        <div className="flex flex-col gap-4">
                            <a
                                href="mailto:vuongtrungkien77forwork@gmail.com"
                                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
                            >
                                <Mail size={18} />
                                <span>vuongtrungkien77forwork@gmail.com</span>
                            </a>
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-2xl transition-all border border-white/10 backdrop-blur-sm active:scale-[0.98]"
                            >
                                {t("about_home_btn")}
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
