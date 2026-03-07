"use client";

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useAuth } from '@/context/useAuth';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock } from 'lucide-react';
import Captcha from '@/components/Captcha';

interface FormErrors {
    loginId?: string;
    password?: string;
    captcha?: string;
}

export default function LoginPage() {
    const { login } = useAuth();
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
                if (!value.trim()) return 'Please enter your email or username';
                break;
            case 'password':
                if (!value) return 'Please enter your password';
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

        if (!submittedToken) {
            newErrors.captcha = 'Please complete the captcha';
            hasErrors = true;
        }

        setErrors(newErrors);
        setTouched({
            loginId: true,
            password: true,
            captcha: true,
        });

        if (hasErrors || !submittedToken) return;

        setLoading(true);
        try {
            await login(loginId, password, submittedToken);
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { message?: string; error?: string } } };
            const errorMessage =
                axiosError.response?.data?.message ||
                axiosError.response?.data?.error ||
                'Login failed. Please try again.';

            setError(errorMessage);
            setCaptchaToken(null);
        } finally {
            setLoading(false);
        }
    };

    const getInputClassName = (fieldName: keyof FormErrors) => {
        const baseClass =
            'block h-12 w-full rounded-xl border bg-white pl-11 pr-4 text-[15px] text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100';

        if (errors[fieldName] && touched[fieldName]) {
            return `${baseClass} border-red-400 focus:border-red-500 focus:ring-red-100`;
        }

        return `${baseClass} border-gray-200 hover:border-gray-300`;
    };

    return (
        <div className="relative min-h-screen overflow-hidden">
            <div className="absolute inset-0">
                <Image
                    src="/images/background.png"
                    alt="background"
                    fill
                    priority
                    className="object-cover"
                />
            </div>
            <div className="absolute inset-0 bg-black/40"></div>

            <div className="relative flex min-h-screen items-center justify-center px-4 py-8">
                <div className="w-full max-w-[420px] rounded-xl border border-white/30 bg-white/90 p-8 shadow-xl backdrop-blur-lg sm:p-9">
                    <div>
                        <div className="mb-6 flex justify-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white shadow-lg shadow-blue-600/20">
                                R
                            </div>
                        </div>
                        <h2 className="text-center text-3xl font-semibold tracking-tight text-slate-900">Sign In</h2>
                        <p className="mt-2 text-center text-sm text-slate-500">
                            Sign in to continue exploring your ideal rental home.
                        </p>
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
                                    placeholder="Email or username"
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
                                    placeholder="Password"
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
                                    ? 'cursor-not-allowed bg-blue-400'
                                    : 'bg-blue-600 shadow-md shadow-blue-600/25 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg'
                                } focus:outline-none focus:ring-4 focus:ring-blue-100`}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>

                        <p className="pt-1 text-center text-sm text-slate-500">
                            Do not have an account?{' '}
                            <Link href="/register" className="font-semibold text-blue-600 transition-colors hover:text-blue-700">
                                Create one
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
