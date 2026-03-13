"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ChevronLeft, Send, AlertCircle, CheckCircle2, 
    Flag, MessageSquare, Subtitles
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/api/axios';

export default function SupportTicketPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState('MEDIUM');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus('idle');

        try {
            await api.post('/support/tickets', {
                subject,
                message,
                priority
            });
            setStatus('success');
            setSubject('');
            setMessage('');
            setPriority('MEDIUM');
            setTimeout(() => router.push('/profile/help-support'), 3000);
        } catch (error) {
            console.error('Failed to submit ticket:', error);
            setStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header */}
            <header className="sticky top-0 z-40 w-full bg-white/70 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
                <div className="max-w-xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.back()}
                            className="p-2.5 bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50 rounded-2xl transition-all shadow-sm"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t("support_ticket_title")}</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-4 py-8 sm:py-12">
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden relative">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="p-8 sm:p-10 relative z-10">
                        {status === 'success' ? (
                            <div className="text-center py-10 space-y-6 animate-in fade-in zoom-in duration-500">
                                <div className="inline-flex p-5 bg-teal-100 text-teal-600 rounded-full">
                                    <CheckCircle2 className="w-12 h-12" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black text-slate-900">Submitted!</h2>
                                    <p className="text-slate-600 font-medium leading-relaxed">
                                        {t("support_success_msg")}
                                    </p>
                                </div>
                                <p className="text-sm text-slate-400 font-medium">Redirecting back...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Error Message */}
                                {status === 'error' && (
                                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-in slide-in-from-top-4 duration-300">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        <p className="text-sm font-bold">{t("support_error_msg")}</p>
                                    </div>
                                )}

                                {/* Subject */}
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-wider ml-1">
                                        <Subtitles className="w-4 h-4 text-slate-400" />
                                        {t("support_subject_label")}
                                    </label>
                                    <input 
                                        required
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder={t("support_subject_placeholder")}
                                        className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-medium"
                                    />
                                </div>

                                {/* Priority */}
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-wider ml-1">
                                        <Flag className="w-4 h-4 text-slate-400" />
                                        {t("support_priority_label")}
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { id: 'LOW', label: t("support_priority_low"), color: 'hover:border-blue-400 hover:bg-blue-50 text-blue-600 border-blue-100 bg-blue-50/30' },
                                            { id: 'MEDIUM', label: t("support_priority_medium"), color: 'hover:border-amber-400 hover:bg-amber-50 text-amber-600 border-amber-100 bg-amber-50/30' },
                                            { id: 'HIGH', label: t("support_priority_high"), color: 'hover:border-rose-400 hover:bg-rose-50 text-rose-600 border-rose-100 bg-rose-50/30' }
                                        ].map((p) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => setPriority(p.id)}
                                                className={`h-12 rounded-xl border-2 transition-all font-bold text-sm ${
                                                    priority === p.id 
                                                    ? 'border-slate-900 bg-slate-900 text-white shadow-lg' 
                                                    : `bg-white border-slate-200 text-slate-600 hover:border-slate-300`
                                                }`}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Message */}
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-wider ml-1">
                                        <MessageSquare className="w-4 h-4 text-slate-400" />
                                        {t("support_message_label")}
                                    </label>
                                    <textarea 
                                        required
                                        rows={6}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder={t("support_message_placeholder")}
                                        className="w-full p-6 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-medium resize-none"
                                    />
                                </div>

                                {/* Submit Button */}
                                <button 
                                    disabled={isSubmitting}
                                    type="submit"
                                    className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group shadow-xl shadow-slate-200"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            {t("support_submitting_btn")}
                                        </>
                                    ) : (
                                        <>
                                            {t("support_submit_btn")}
                                            <Send className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
