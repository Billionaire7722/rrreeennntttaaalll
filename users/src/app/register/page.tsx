"use client";

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useAuth } from '@/context/useAuth';
import Link from 'next/link';
import Image from 'next/image';
import { User, Mail, Lock, Phone } from 'lucide-react';
import Captcha from '@/components/Captcha';

interface FormErrors {
    name?: string;
    username?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    captcha?: string;
}

const passwordRules = [
    { id: 'length', label: '8-12 characters', test: (p: string) => p.length >= 8 && p.length <= 12 },
    { id: 'uppercase', label: 'Uppercase letter (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
    { id: 'lowercase', label: 'Lowercase letter (a-z)', test: (p: string) => /[a-z]/.test(p) },
    { id: 'number', label: 'Number (0-9)', test: (p: string) => /\d/.test(p) },
    { id: 'special', label: 'Special character (@$!%*?&)', test: (p: string) => /[@$!%*?&]/.test(p) },
];

export default function RegisterPage() {
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        name: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const passwordValidations = passwordRules.map((rule) => ({
        ...rule,
        valid: rule.test(formData.password),
    }));

    const isPasswordValid = passwordValidations.every((v) => v.valid);

    const validateField = (name: string, value: string): string | undefined => {
        switch (name) {
            case 'name':
                if (!value.trim()) return 'Please enter your full name';
                break;
            case 'username':
                if (!value.trim()) return 'Please enter a username';
                if (value.length < 3) return 'Username must be at least 3 characters';
                break;
            case 'email':
                if (!value.trim()) return 'Please enter your email';
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
                break;
            case 'phone':
                if (!value.trim()) return 'Please enter your phone number';
                break;
            case 'password':
                if (!value) return 'Please enter a password';
                if (!isPasswordValid) return 'Password is not strong enough';
                break;
            case 'confirmPassword':
                if (!value) return 'Please confirm your password';
                if (value !== formData.password) return 'Passwords do not match';
                break;
        }
        return undefined;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

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

        Object.keys(formData).forEach((key) => {
            const fieldError = validateField(key, formData[key as keyof typeof formData]);
            if (fieldError) {
                newErrors[key as keyof FormErrors] = fieldError;
                hasErrors = true;
            }
        });

        if (!submittedToken) {
            newErrors.captcha = 'Please complete the captcha';
            hasErrors = true;
        }

        setErrors(newErrors);
        setTouched({
            name: true,
            username: true,
            email: true,
            phone: true,
            password: true,
            confirmPassword: true,
            captcha: true,
        });

        if (hasErrors || !submittedToken) return;

        setLoading(true);
        try {
            await register({
                username: formData.username,
                email: formData.email,
                name: formData.name,
                phone: formData.phone,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                captchaToken: submittedToken,
            });
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { message?: string; error?: string } } };
            const errorMessage =
                axiosError.response?.data?.message ||
                axiosError.response?.data?.error ||
                'Registration failed. Please try again.';

            if (errorMessage.toLowerCase().includes('email')) {
                setErrors((prev) => ({ ...prev, email: errorMessage }));
            } else if (errorMessage.toLowerCase().includes('username')) {
                setErrors((prev) => ({ ...prev, username: errorMessage }));
            } else if (errorMessage.toLowerCase().includes('password')) {
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
                        <h2 className="text-center text-3xl font-semibold tracking-tight text-slate-900">Create Account</h2>
                        <p className="mt-2 text-center text-sm text-slate-500">Sign up quickly to get started.</p>
                    </div>

                    <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-center text-sm text-red-500">{error}</div>
                        )}

                        <div className="space-y-4">
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={getInputClassName('name')}
                                    placeholder="Full name"
                                />
                            </div>
                            {errors.name && touched.name && <p className="text-xs text-red-500">{errors.name}</p>}

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
                                    placeholder="Username"
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
                                    placeholder="Email address"
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
                                    placeholder="Phone number"
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
                                        placeholder="Password"
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
                                        placeholder="Confirm password"
                                    />
                                </div>
                            </div>
                            {errors.password && touched.password && <p className="text-xs text-red-500">{errors.password}</p>}
                            {errors.confirmPassword && touched.confirmPassword && (
                                <p className="text-xs text-red-500">{errors.confirmPassword}</p>
                            )}

                            {formData.password && (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                                    <p className="mb-2 font-medium text-slate-700">Password requirements:</p>
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
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>

                        <p className="pt-1 text-center text-sm text-slate-500">
                            Already have an account?{' '}
                            <Link href="/login" className="font-semibold text-blue-600 transition-colors hover:text-blue-700">
                                Sign in
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
