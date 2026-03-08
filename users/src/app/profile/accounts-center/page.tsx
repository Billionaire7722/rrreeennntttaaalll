"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    User, Mail, Lock, ChevronLeft, ShieldCheck, 
    ArrowRight, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { useAuth } from '@/context/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/api/axios';

export default function AccountsCenter() {
    const { user, login } = useAuth();
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
            setProfileMessage({ type: 'success', text: t('profile_updated_success') || 'Cập nhật thông tin thành công!' });
            // Optionally refresh user data in context if needed
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
            setPasswordMessage({ type: 'success', text: t('password_updated_success') || 'Đổi mật khẩu thành công!' });
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
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6 text-slate-600" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-900">{t("accounts_center")}</h1>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
                {/* Intro Section */}
                <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg shadow-teal-600/20">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold mb-1">{t("account_privacy_title") || "Tài khoản & Bảo mật"}</h2>
                            <p className="text-teal-50 text-sm leading-relaxed">
                                {t("account_privacy_desc") || "Quản lý thông tin cá nhân và cài đặt bảo mật của bạn tại đây."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Profile Information */}
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                        <User className="w-5 h-5 text-teal-600" />
                        <h3 className="font-bold text-slate-900 text-lg">{t("personal_info") || "Thông tin cá nhân"}</h3>
                    </div>
                    <form onSubmit={handleProfileSubmit} className="p-6 space-y-6">
                        {profileMessage.text && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300 ${
                                profileMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                            }`}>
                                {profileMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                {profileMessage.text}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">{t("last_name") || "Họ"}</label>
                                <input 
                                    type="text"
                                    value={profileData.lastName}
                                    onChange={e => setProfileData({...profileData, lastName: e.target.value})}
                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-[15px]"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">{t("first_name") || "Tên"}</label>
                                <input 
                                    type="text"
                                    value={profileData.firstName}
                                    onChange={e => setProfileData({...profileData, firstName: e.target.value})}
                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-[15px]"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">{t("email_label") || "Email"}</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input 
                                    type="email"
                                    value={profileData.email}
                                    onChange={e => setProfileData({...profileData, email: e.target.value})}
                                    className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-[15px]"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button 
                                type="submit"
                                disabled={isUpdatingProfile}
                                className="px-8 h-12 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 min-w-[160px] disabled:opacity-70"
                            >
                                {isUpdatingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : t("save_changes")}
                            </button>
                        </div>
                    </form>
                </section>

                {/* Password Change */}
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                        <Lock className="w-5 h-5 text-teal-600" />
                        <h3 className="font-bold text-slate-900 text-lg">{t("security_settings") || "Bảo mật & Mật khẩu"}</h3>
                    </div>
                    <form onSubmit={handlePasswordSubmit} className="p-6 space-y-6">
                        {passwordMessage.text && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300 ${
                                passwordMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                            }`}>
                                {passwordMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                {passwordMessage.text}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">{t("current_password") || "Mật khẩu hiện tại"}</label>
                            <input 
                                type="password"
                                value={passwordData.oldPassword}
                                onChange={e => setPasswordData({...passwordData, oldPassword: e.target.value})}
                                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-[15px]"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">{t("new_password") || "Mật khẩu mới"}</label>
                                <input 
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-[15px]"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">{t("confirm_new_password") || "Xác nhận mật khẩu mới"}</label>
                                <input 
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-[15px]"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button 
                                type="submit"
                                disabled={isUpdatingPassword}
                                className="px-8 h-12 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 min-w-[160px] disabled:opacity-70"
                            >
                                {isUpdatingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : t("update_password") || "Cập nhật mật khẩu"}
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </div>
    );
}
