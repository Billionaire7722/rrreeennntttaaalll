"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    User, Mail, Lock, ChevronLeft, ShieldCheck, 
    CheckCircle2, AlertCircle, Loader2, KeyRound, 
    UserCircle2, Sparkles, Fingerprint
} from 'lucide-react';
import { useAuth } from '@/context/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/api/axios';

export default function AccountsCenter() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const router = useRouter();

    // Profile State
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        email: ''
    });
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

    // Password State
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (user) {
            setProfileData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || ''
            });
        }
    }, [user]);

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdatingProfile(true);
        setProfileMessage({ type: '', text: '' });
        try {
            await api.post('/users/profile', profileData);
            setProfileMessage({ type: 'success', text: t('profile_updated_success') || 'Profile updated successfully!' });
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to update profile';
            setProfileMessage({ type: 'error', text: msg });
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMessage({ type: 'error', text: t('err_passwords_mismatch') || 'Passwords do not match' });
            return;
        }
        setIsUpdatingPassword(true);
        setPasswordMessage({ type: '', text: '' });
        try {
            await api.post('/users/change-password', passwordData);
            setPasswordMessage({ type: 'success', text: t('password_updated_success') || 'Password changed successfully!' });
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to change password';
            setPasswordMessage({ type: 'error', text: msg });
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
                    <p className="text-slate-500 font-medium animate-pulse">{t("loading")}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f1f5f9] pb-24 selection:bg-teal-100 selection:text-teal-900">
            {/* Elegant Glassmorphism Header */}
            <header className="sticky top-0 z-40 w-full bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm transition-all duration-300">
                <div className="max-w-4xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.back()}
                            className="group p-2.5 bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50 rounded-2xl transition-all duration-300 shadow-sm"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-600 group-hover:text-teal-600 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-none">{t("accounts_center")}</h1>
                            <p className="hidden sm:block text-[13px] font-medium text-slate-500 mt-1">{t("settings")}</p>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                            <Fingerprint size={16} />
                        </div>
                        <span className="text-[13px] font-bold text-slate-700 px-2 pr-3">{user.username || user.email?.split('@')[0]}</span>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-10">
                {/* Hero Section with Premium Gradient */}
                <div className="group relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 sm:p-10 shadow-2xl shadow-slate-900/20">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-teal-500/20 rounded-full blur-[80px] group-hover:bg-teal-400/30 transition-colors duration-700"></div>
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]"></div>
                    
                    <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 text-center md:text-left">
                        <div className="relative">
                            <div className="p-5 bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl backdrop-blur-md shadow-inner">
                                <ShieldCheck className="w-10 h-10 text-teal-400" />
                            </div>
                            <div className="absolute -top-2 -right-2 p-1.5 bg-emerald-500 rounded-full shadow-lg border-2 border-slate-900">
                                <Sparkles className="w-3 h-3 text-white" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3 tracking-tight">
                                {t("account_privacy_title") || "Tài khoản & Bảo mật"}
                            </h2>
                            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl font-medium">
                                {t("account_privacy_desc") || "Manage your personal details and secure your account settings here."}
                            </p>
                        </div>
                        <div className="hidden lg:block self-center">
                            <div className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-colors cursor-default">
                                <span className="text-[13px] font-black uppercase tracking-wider text-teal-400">Secure Access</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-10">
                    {/* Personal Information Card */}
                    <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/60">
                        <div className="px-8 py-7 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-teal-100 rounded-2xl text-teal-600 transition-transform group-hover:scale-110 duration-500">
                                    <UserCircle2 className="w-6 h-6" />
                                </div>
                                <h3 className="font-black text-slate-900 text-lg sm:text-xl tracking-tight">{t("personal_info") || "Personal Information"}</h3>
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Settings</span>
                        </div>
                        
                        <form onSubmit={handleProfileSubmit} className="p-8 sm:p-10 space-y-8">
                            {profileMessage.text && (
                                <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-4 duration-500 ${
                                    profileMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' : 'bg-red-50 text-red-700 border border-red-100/50'
                                }`}>
                                    <div className={`p-1.5 rounded-lg ${profileMessage.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                        {profileMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    </div>
                                    {profileMessage.text}
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[13px] font-black text-slate-600 uppercase tracking-wider ml-1">{t("first_name") || "First Name"}</label>
                                    <input 
                                        type="text"
                                        value={profileData.firstName}
                                        onChange={e => setProfileData({...profileData, firstName: e.target.value})}
                                        placeholder="First name"
                                        className="w-full h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all duration-300 text-[15px] font-bold text-slate-800 placeholder:text-slate-400"
                                        required
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[13px] font-black text-slate-600 uppercase tracking-wider ml-1">{t("last_name") || "Last Name"}</label>
                                    <input 
                                        type="text"
                                        value={profileData.lastName}
                                        onChange={e => setProfileData({...profileData, lastName: e.target.value})}
                                        placeholder="Last name"
                                        className="w-full h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all duration-300 text-[15px] font-bold text-slate-800 placeholder:text-slate-400"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[13px] font-black text-slate-600 uppercase tracking-wider ml-1">{t("email_label") || "Email Address"}</label>
                                <div className="relative group/input">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within/input:text-teal-500 transition-colors" />
                                    <input 
                                        type="email"
                                        value={profileData.email}
                                        onChange={e => setProfileData({...profileData, email: e.target.value})}
                                        placeholder="yourname@example.com"
                                        className="w-full h-14 pl-14 pr-5 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all duration-300 text-[15px] font-bold text-slate-800 placeholder:text-slate-400"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button 
                                    type="submit"
                                    disabled={isUpdatingProfile}
                                    className="w-full sm:w-auto px-10 h-14 bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-white font-black rounded-2xl transition-all duration-300 shadow-xl shadow-teal-500/20 hover:shadow-teal-500/30 flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:bg-teal-600 disabled:active:scale-100"
                                >
                                    {isUpdatingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <>
                                            <span>{t("save_changes")}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </section>

                    {/* Security & Password Card */}
                    <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/60">
                        <div className="px-8 py-7 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-slate-100 rounded-2xl text-slate-900 transition-transform group-hover:scale-110 duration-500">
                                    <KeyRound className="w-6 h-6" />
                                </div>
                                <h3 className="font-black text-slate-900 text-lg sm:text-xl tracking-tight">{t("security_settings") || "Security & Password"}</h3>
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Privacy</span>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="p-8 sm:p-10 space-y-8">
                            {passwordMessage.text && (
                                <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-4 duration-500 ${
                                    passwordMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' : 'bg-red-50 text-red-700 border border-red-100/50'
                                }`}>
                                    <div className={`p-1.5 rounded-lg ${passwordMessage.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                        {passwordMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    </div>
                                    {passwordMessage.text}
                                </div>
                            )}

                            <div className="space-y-3">
                                <label className="text-[13px] font-black text-slate-600 uppercase tracking-wider ml-1">{t("current_password") || "Current Password"}</label>
                                <div className="relative group/input">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within/input:text-slate-900 transition-colors" />
                                    <input 
                                        type="password"
                                        value={passwordData.oldPassword}
                                        onChange={e => setPasswordData({...passwordData, oldPassword: e.target.value})}
                                        placeholder="••••••••••••"
                                        className="w-full h-14 pl-14 pr-5 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all duration-300 text-[15px] font-bold text-slate-800"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[13px] font-black text-slate-600 uppercase tracking-wider ml-1">{t("new_password") || "New Password"}</label>
                                    <input 
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                                        placeholder="Min 6 characters"
                                        className="w-full h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all duration-300 text-[15px] font-bold text-slate-800"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[13px] font-black text-slate-600 uppercase tracking-wider ml-1">{t("confirm_new_password") || "Confirm Password"}</label>
                                    <input 
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                        placeholder="Repeat new password"
                                        className="w-full h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all duration-300 text-[15px] font-bold text-slate-800"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button 
                                    type="submit"
                                    disabled={isUpdatingPassword}
                                    className="w-full sm:w-auto px-10 h-14 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-black rounded-2xl transition-all duration-300 shadow-xl shadow-slate-900/20 hover:shadow-slate-900/30 flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:bg-slate-900 disabled:active:scale-100"
                                >
                                    {isUpdatingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <>
                                            <span>{t("update_password") || "Update Password"}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </main>
        </div>
    );
}
