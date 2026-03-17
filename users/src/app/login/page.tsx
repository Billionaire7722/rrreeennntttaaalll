"use client";

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useAuth } from '@/context/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock } from 'lucide-react';
import Captcha from '@/components/Captcha';
import ThemeToggle from '@/components/ThemeToggle';

interface FormErrors {
    loginId?: string;
    password?: string;
    captcha?: string;
}

interface ApiErrorData {
    message?: string | string[];
    error?: string | { message?: string };
}

interface ApiErrorShape {
    response?: {
        data?: ApiErrorData;
    };
}

function extractErrorMessage(data?: ApiErrorData) {
    if (!data) return undefined;
    if (typeof data.message === 'string' || Array.isArray(data.message)) return data.message;
    if (typeof data.error === 'string') return data.error;
    if (typeof data.error === 'object' && data.error !== null) return data.error.message;
    return undefined;
}

export default function LoginPage() {
    const { login } = useAuth();
    const { t } = useLanguage();
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const validateField = (name: string, value: string): string | undefined => {
        switch (name) {
            case 'loginId':
                if (!value.trim()) return t('err_enter_email_username');
                break;
            case 'password':
                if (!value) return t('err_enter_password');
                break;
        }
        return undefined;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'loginId') {
            setLoginId(value);
        } else if (name === 'password') {
            setPassword(value);
        }

        if (touched[name]) {
            const fieldError = validateField(name, value);
            setErrors((prev) => ({ ...prev, [name]: fieldError }));
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
        const fieldError = validateField(name, value);
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

        const loginIdError = validateField('loginId', loginId);
        if (loginIdError) {
            newErrors.loginId = loginIdError;
            hasErrors = true;
        }

        const passwordError = validateField('password', password);
        if (passwordError) {
            newErrors.password = passwordError;
            hasErrors = true;
        }

        setErrors(newErrors);
        setTouched({
            loginId: true,
            password: true,
            captcha: true,
        });

        // if (hasErrors || !submittedToken) return;
        if (hasErrors) return;

        setLoading(true);
        try {
            await login(loginId, password, submittedToken || "dummy_token");
        } catch (err) {
            let errorMessage = t('err_login_failed');

            const data = (err as ApiErrorShape).response?.data;
            if (data) {
                const rawMessage = extractErrorMessage(data);
                
                if (typeof rawMessage === 'string') {
                    errorMessage = rawMessage;
                } else if (Array.isArray(rawMessage)) {
                    errorMessage = rawMessage[0];
                }
            }

            setError(errorMessage);
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
        <div className="relative min-h-screen overflow-hidden flex bg-[var(--theme-bg)] text-[var(--theme-text)]">
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
                            <video
                                src="/assets/vid/greenappleHi.mp4"
                                autoPlay
                                loop
                                muted
                                playsInline
                                width={56}
                                height={56}
                                className="object-contain"
                                style={{ 
                                    mixBlendMode: 'screen',
                                    transform: 'translateZ(0)',
                                    WebkitTransform: 'translateZ(0)'
                                }}
                            />
                            <div>
                                <h1 className="text-2xl font-bold text-white">YourHome</h1>
                                <p className="text-teal-200 text-sm">{t('logo_subtitle')}</p>
                            </div>
                        </div>
                        <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight text-balance">
                            {t('hero_login_title')}
                        </h2>
                        <p className="mt-4 text-lg text-teal-100 leading-relaxed">
                            {t('hero_login_desc')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Right side - Form */}
            <div className="relative flex w-full items-center justify-center bg-[var(--theme-bg)] px-4 py-8 lg:w-1/2">
                <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
                    <ThemeToggle className="bg-white/80" showLabel={false} />
                </div>
                {/* Mobile background */}
                <div className="lg:hidden absolute inset-0">
                    <Image
                        src="/images/auth-background.jpg"
                        alt="Background"
                        fill
                        priority
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-teal-900/80 via-teal-800/70 to-slate-900/90"></div>
                </div>

                <div className="w-full max-w-[420px] relative z-10">
                    {/* Mobile logo */}
                    <div className="lg:hidden mb-6 text-center">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <video
                                src="/assets/vid/greenappleHi.mp4"
                                autoPlay
                                loop
                                muted
                                playsInline
                                width={56}
                                height={56}
                                className="object-contain"
                                style={{ 
                                    mixBlendMode: 'screen',
                                    transform: 'translateZ(0)',
                                    WebkitTransform: 'translateZ(0)'
                                }}
                            />
                            <div className="text-left">
                                <h1 className="text-2xl font-bold text-white">YourHome</h1>
                                <p className="text-teal-200 text-sm">{t('logo_subtitle')}</p>
                            </div>
                        </div>
                        <p className="text-white/80 text-sm max-w-xs mx-auto">
                            {t('hero_login_desc')}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-8 shadow-xl lg:shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-[var(--theme-text)]">{t('login_title')}</h2>
                                <p className="mt-2 text-sm text-[var(--theme-text-muted)]">
                                    {t('login_subtitle')}
                                </p>
                            </div>
                        </div>

                    <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-center text-sm text-red-500">{error}</div>
                        )}

                        <div className="space-y-4">
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email-address"
                                    name="loginId"
                                    type="text"
                                    required
                                    value={loginId}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={getInputClassName('loginId')}
                                    placeholder={t('email_username_placeholder')}
                                />
                            </div>
                            {errors.loginId && touched.loginId && <p className="text-xs text-red-500">{errors.loginId}</p>}

                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={getInputClassName('password')}
                                    placeholder={t('password_placeholder')}
                                />
                            </div>
                            {errors.password && touched.password && <p className="text-xs text-red-500">{errors.password}</p>}
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
                            {loading ? t('signing_in') : t('sign_in_btn')}
                        </button>

                        <p className="pt-1 text-center text-sm text-[var(--theme-text-muted)]">
                            {t('no_account')}{' '}
                            <Link href="/register" className="font-semibold text-teal-600 transition-colors hover:text-teal-700">
                                {t('create_one')}
                            </Link>
                        </p>
                    </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
