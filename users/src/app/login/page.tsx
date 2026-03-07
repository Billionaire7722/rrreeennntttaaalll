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
                                <p className="text-teal-200 text-sm">Find your perfect place</p>
                            </div>
                        </div>
                        <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight text-balance">
                            Discover your next rental home
                        </h2>
                        <p className="mt-4 text-lg text-teal-100 leading-relaxed">
                            Browse thousands of verified listings, connect with landlords, and find the perfect space that feels like home.
                        </p>
                        <div className="mt-8 flex gap-6">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-white">10K+</p>
                                <p className="text-sm text-teal-200">Listings</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-white">5K+</p>
                                <p className="text-sm text-teal-200">Happy Renters</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-white">50+</p>
                                <p className="text-sm text-teal-200">Cities</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-8 bg-slate-50 lg:bg-slate-50 relative">
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
                            <Image
                                src="/images/yh-logo.jpg"
                                alt="Your Home Logo"
                                width={56}
                                height={56}
                                className="rounded-xl shadow-lg"
                            />
                            <div className="text-left">
                                <h1 className="text-2xl font-bold text-white">Your Home</h1>
                                <p className="text-teal-200 text-sm">Find your perfect place</p>
                            </div>
                        </div>
                        <p className="text-white/80 text-sm max-w-xs mx-auto">
                            Discover thousands of rental homes in your area
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-8 shadow-xl lg:shadow-sm border border-slate-200/50 lg:border-slate-200">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Sign in to continue exploring rental homes
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
                                    ? 'cursor-not-allowed bg-teal-400'
                                    : 'bg-teal-600 shadow-md shadow-teal-600/25 hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-lg'
                                } focus:outline-none focus:ring-4 focus:ring-teal-100`}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>

                        <p className="pt-1 text-center text-sm text-slate-500">
                            {"Don't have an account?"}{' '}
                            <Link href="/register" className="font-semibold text-teal-600 transition-colors hover:text-teal-700">
                                Create one
                            </Link>
                        </p>
                    </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
