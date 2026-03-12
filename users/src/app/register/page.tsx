"use client";
import React, { useState } from 'react';

export const dynamic = 'force-dynamic';
import { useAuth } from '@/context/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import Image from 'next/image';
import { User, Mail, Lock, Phone } from 'lucide-react';
import Captcha from '@/components/Captcha';

interface FormErrors {
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    captcha?: string;
    acceptTerms?: string;
}

const passwordRules = (t: any) => [
    { id: 'length', label: t('rule_length'), test: (p: string) => p.length >= 8 && p.length <= 12 },
    { id: 'uppercase', label: t('rule_uppercase'), test: (p: string) => /[A-Z]/.test(p) },
    { id: 'lowercase', label: t('rule_lowercase'), test: (p: string) => /[a-z]/.test(p) },
    { id: 'number', label: t('rule_number'), test: (p: string) => /\d/.test(p) },
    { id: 'special', label: t('rule_special'), test: (p: string) => /[@$!%*?&]/.test(p) },
];

export default function RegisterPage() {
    const { register } = useAuth();
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false,
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const rules = passwordRules(t);
    const passwordValidations = rules.map((rule) => ({
        ...rule,
        valid: rule.test(formData.password),
    }));

    const isPasswordValid = passwordValidations.every((v) => v.valid);

    const validateField = (name: string, value: string): string | undefined => {
        switch (name) {
            case 'firstName':
                if (!value.trim()) return t('err_enter_first_name');
                break;
            case 'lastName':
                if (!value.trim()) return t('err_enter_last_name');
                break;
            case 'username':
                if (!value.trim()) return t('err_enter_username');
                if (value.length < 3) return t('err_username_length');
                break;
            case 'email':
                if (!value.trim()) return t('err_enter_email');
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t('err_invalid_email');
                break;
            case 'phone':
                if (!value.trim()) return t('err_enter_phone');
                break;
            case 'password':
                if (!value) return t('err_enter_password');
                break;
            case 'confirmPassword':
                if (!value) return t('err_confirm_password');
                if (value !== formData.password) return t('err_passwords_mismatch');
                break;
            case 'acceptTerms':
                if (!value) return t('err_accept_terms');
                break;
        }
        return undefined;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        const fieldValue = type === 'checkbox' ? checked : value;
        setFormData({ ...formData, [name]: fieldValue });

        if (touched[name]) {
            const fieldError = validateField(name, String(fieldValue));
            setErrors((prev) => ({ ...prev, [name]: fieldError }));
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
        const fieldError = validateField(name, type === 'checkbox' ? String(checked) : value);
        setErrors((prev) => ({ ...prev, [name]: fieldError }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const form = e.currentTarget as HTMLFormElement;
        const submittedToken =
            (new FormData(form).get('cf-turnstile-response') as string | null) || captchaToken;

        const newErrors: FormErrors = {};
        let hasErrors = false;

        Object.keys(formData).forEach((key) => {
            const val = formData[key as keyof typeof formData];
            const fieldError = validateField(key, typeof val === 'boolean' ? String(val) : val);
            if (fieldError) {
                newErrors[key as keyof FormErrors] = fieldError;
                hasErrors = true;
            }
        });

        if (!submittedToken) {
            newErrors.captcha = t('err_complete_captcha');
            hasErrors = true;
        }

        setErrors(newErrors);
        setTouched({
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            phone: true,
            password: true,
            confirmPassword: true,
            captcha: true,
            acceptTerms: true,
        });

        if (hasErrors || !submittedToken) return;

        setLoading(true);
        try {
            await register({
                username: formData.username,
                email: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                captchaToken: submittedToken,
            });
        } catch (err: any) {
            let errorMessage = t('err_login_failed');
            
            const data = err.response?.data;
            if (data) {
                const rawMessage = data.message || data.error?.message || data.error;
                
                if (typeof rawMessage === 'string') {
                    errorMessage = rawMessage;
                } else if (Array.isArray(rawMessage)) {
                    errorMessage = rawMessage.join(', ');
                } else if (typeof rawMessage === 'object' && rawMessage !== null) {
                    errorMessage = rawMessage.message || JSON.stringify(rawMessage);
                }
            }

            const lowerMsg = errorMessage.toLowerCase();
            if (lowerMsg.includes('email')) {
                setErrors((prev) => ({ ...prev, email: errorMessage }));
            } else if (lowerMsg.includes('username')) {
                setErrors((prev) => ({ ...prev, username: errorMessage }));
            } else if (lowerMsg.includes('password')) {
                setErrors((prev) => ({ ...prev, password: errorMessage }));
            } else {
                setError(errorMessage);
            }

            setCaptchaToken(null);
        } finally {
            setLoading(false);
        }
    };

    const getInputClassName = (fieldName: keyof FormErrors) => {
        const baseClass =
            'block h-12 w-full rounded-xl border bg-white pl-11 pr-4 text-[15px] text-gray-900 placeholder:text-gray-400 transition-all focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-100';

        if (errors[fieldName] && touched[fieldName]) {
            return `${baseClass} border-red-400 focus:border-red-500 focus:ring-red-100`;
        }

        return `${baseClass} border-gray-200 hover:border-gray-300`;
    };

    return (
        <div className="relative min-h-screen overflow-hidden flex">
            {/* Left side - Image */}
            <div className="hidden lg:block lg:w-1/2 relative">
                <Image
                    src="/images/auth-background.jpg"
                    alt="Beautiful home interior"
                    fill
                    priority
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-teal-900/70 to-teal-800/50"></div>
                <div className="absolute inset-0 flex flex-col justify-center px-12 xl:px-16">
                    <div className="max-w-md">
                        <div className="flex items-center gap-3 mb-8">
                            <Image
                                src="/images/yh-logo.jpg"
                                alt="Your Home Logo"
                                width={56}
                                height={56}
                                className="rounded-xl shadow-lg"
                            />
                            <div>
                                <h1 className="text-2xl font-bold text-white">Your Home</h1>
                                <p className="text-teal-200 text-sm">{t('logo_subtitle')}</p>
                            </div>
                        </div>
                        <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight text-balance">
                            {t('hero_register_title')}
                        </h2>
                        <p className="mt-4 text-lg text-teal-100 leading-relaxed">
                            {t('hero_register_desc')}
                        </p>
                        <div className="mt-8 space-y-3">
                            <div className="flex items-center gap-3 text-white">
                                <div className="w-8 h-8 rounded-full bg-teal-500/30 flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span>{t('tour_step1_title')}</span>
                            </div>
                            <div className="flex items-center gap-3 text-white">
                                <div className="w-8 h-8 rounded-full bg-teal-500/30 flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span>{t('tour_step2_title')}</span>
                            </div>
                            <div className="flex items-center gap-3 text-white">
                                <div className="w-8 h-8 rounded-full bg-teal-500/30 flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span>{t('chats')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-6 lg:py-8 bg-slate-50 lg:bg-slate-50 overflow-y-auto relative min-h-screen">
                {/* Mobile background */}
                <div className="lg:hidden absolute inset-0">
                    <Image
                    src="/images/auth-background.jpg"
                    alt="Beautiful home interior"
                    fill
                    priority
                    className="object-cover"
                />
                    <div className="absolute inset-0 bg-gradient-to-b from-teal-900/80 via-teal-800/70 to-slate-900/90"></div>
                </div>

                <div className="w-full max-w-[420px] relative z-10 my-auto">
                    {/* Mobile logo */}
                    <div className="lg:hidden mb-5 text-center">
                        <div className="flex items-center justify-center gap-3 mb-3">
                            <Image
                                src="/images/yh-logo.jpg"
                                alt="Your Home Logo"
                                width={48}
                                height={48}
                                className="rounded-xl shadow-lg"
                            />
                            <div className="text-left">
                                <h1 className="text-xl font-bold text-white">Your Home</h1>
                                <p className="text-teal-200 text-xs">{t('logo_subtitle')}</p>
                            </div>
                        </div>
                        <p className="text-white/80 text-sm max-w-xs mx-auto">
                            {t('register_subtitle')}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-xl lg:shadow-sm border border-slate-200/50 lg:border-slate-200">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{t('register_title')}</h2>
                                <p className="mt-2 text-sm text-slate-500">{t('register_subtitle')}</p>
                            </div>
                        </div>

                    <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-center text-sm text-red-500">{error}</div>
                        )}

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                            <User className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="firstName"
                                            name="firstName"
                                            type="text"
                                            required
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={getInputClassName('firstName')}
                                            placeholder={t('first_name_placeholder')}
                                        />
                                    </div>
                                    {errors.firstName && touched.firstName && <p className="text-[10px] text-red-500">{errors.firstName}</p>}
                                </div>

                                <div className="space-y-1">
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                            <User className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="lastName"
                                            name="lastName"
                                            type="text"
                                            required
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={getInputClassName('lastName')}
                                            placeholder={t('last_name_placeholder')}
                                        />
                                    </div>
                                    {errors.lastName && touched.lastName && <p className="text-[10px] text-red-500">{errors.lastName}</p>}
                                </div>
                            </div>

                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={getInputClassName('username')}
                                    placeholder={t('username_placeholder')}
                                />
                            </div>
                            {errors.username && touched.username && <p className="text-xs text-red-500">{errors.username}</p>}

                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={getInputClassName('email')}
                                    placeholder={t('email_placeholder')}
                                />
                            </div>
                            {errors.email && touched.email && <p className="text-xs text-red-500">{errors.email}</p>}

                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                    <Phone className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={getInputClassName('phone')}
                                    placeholder={t('phone_placeholder')}
                                />
                            </div>
                            {errors.phone && touched.phone && <p className="text-xs text-red-500">{errors.phone}</p>}

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={getInputClassName('password')}
                                        placeholder={t('password_placeholder')}
                                    />
                                </div>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={getInputClassName('confirmPassword')}
                                        placeholder={t('confirm_password_placeholder')}
                                    />
                                </div>
                            </div>
                            {errors.password && touched.password && <p className="text-xs text-red-500">{errors.password}</p>}
                            {errors.confirmPassword && touched.confirmPassword && (
                                <p className="text-xs text-red-500">{errors.confirmPassword}</p>
                            )}

                            {formData.password && (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                                    <p className="mb-2 font-medium text-slate-700">{t('password_requirements')}</p>
                                    <div className="space-y-1">
                                        {passwordValidations.map((rule) => (
                                            <div
                                                key={rule.id}
                                                className={`flex items-center ${rule.valid ? 'text-emerald-600' : 'text-slate-500'}`}
                                            >
                                                <span className="mr-2">{rule.valid ? '✓' : '○'}</span>
                                                {rule.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3 pt-2">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-5 items-center">
                                        <input
                                            id="acceptTerms"
                                            name="acceptTerms"
                                            type="checkbox"
                                            required
                                            checked={formData.acceptTerms as boolean}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 transition-colors"
                                        />
                                    </div>
                                    <div className="text-sm">
                                        <label htmlFor="acceptTerms" className="text-slate-600 leading-snug select-none">
                                            {t('accept_terms_label').split(t('terms_of_service')).map((part, i, arr) => (
                                                <React.Fragment key={i}>
                                                    {part.split(t('privacy_policy')).map((subPart, j, subArr) => (
                                                        <React.Fragment key={j}>
                                                            {subPart}
                                                            {j < subArr.length - 1 && (
                                                                <Link 
                                                                    href="/privacy" 
                                                                    className="font-semibold underline underline-offset-4 hover:opacity-80 transition-opacity"
                                                                    style={{ color: 'var(--color-emerald-600)' }}
                                                                >
                                                                    {t('privacy_policy')}
                                                                </Link>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                    {i < arr.length - 1 && (
                                                        <Link 
                                                            href="/terms" 
                                                            className="font-semibold underline underline-offset-4 hover:opacity-80 transition-opacity"
                                                            style={{ color: 'var(--color-emerald-600)' }}
                                                        >
                                                            {t('terms_of_service')}
                                                        </Link>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </label>
                                    </div>
                                </div>
                                {errors.acceptTerms && touched.acceptTerms && (
                                    <p className="text-xs text-red-500">{errors.acceptTerms}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <Captcha onChange={setCaptchaToken} error={!!(errors.captcha && touched.captcha)} />
                            {errors.captcha && touched.captcha && (
                                <p className="mt-1 text-center text-xs text-red-500">{errors.captcha}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex h-12 w-full items-center justify-center rounded-xl text-sm font-semibold text-white transition-all duration-200 ${loading
                                    ? 'cursor-not-allowed bg-teal-400'
                                    : 'bg-teal-600 shadow-md shadow-teal-600/25 hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-lg'
                                } focus:outline-none focus:ring-4 focus:ring-teal-100`}
                        >
                            {loading ? t('creating_account') : t('create_account_btn')}
                        </button>

                        <p className="pt-1 text-center text-sm text-slate-500">
                            {t('already_have_account')}{' '}
                            <Link href="/login" className="font-semibold text-teal-600 transition-colors hover:text-teal-700">
                                {t('sign_in_link')}
                            </Link>
                        </p>
                    </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
