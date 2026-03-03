"use client";

import { useState } from 'react';
import { useAuth } from '@/context/useAuth';
import Link from 'next/link';
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

    // Validate individual field
    const validateField = (name: string, value: string): string | undefined => {
        switch (name) {
            case 'loginId':
                if (!value.trim()) return 'Vui lòng nhập email hoặc tên đăng nhập';
                break;
            case 'password':
                if (!value) return 'Vui lòng nhập mật khẩu';
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
        
        // Validate on change if field was touched
        if (touched[name]) {
            const fieldError = validateField(name, value);
            setErrors(prev => ({ ...prev, [name]: fieldError }));
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        const fieldError = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: fieldError }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        // Validate all fields
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

        // Validate captcha
        if (!captchaToken) {
            newErrors.captcha = 'Vui lòng xác nhận captcha';
            hasErrors = true;
        }

        setErrors(newErrors);
        setTouched({
            loginId: true,
            password: true,
            captcha: true
        });

        if (hasErrors) return;

        setLoading(true);
        try {
            await login(loginId, password);
        } catch (err: any) {
            // Get error message from backend
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Đăng nhập thất bại. Vui lòng thử lại.';
            
            // Check if account is locked
            if (errorMessage.includes('khóa') || errorMessage.includes('locked')) {
                setError(errorMessage);
            } else {
                setError(errorMessage);
            }
            
            // Reset captcha on error
            setCaptchaToken(null);
        } finally {
            setLoading(false);
        }
    };

    const getInputClassName = (fieldName: keyof FormErrors) => {
        const baseClass = "appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
        if (errors[fieldName] && touched[fieldName]) {
            return `${baseClass} border-red-500 bg-red-50`;
        }
        return `${baseClass} border-gray-300`;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Đăng nhập
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Chưa có tài khoản?{' '}
                        <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                            Đăng ký ngay
                        </Link>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm text-center">
                            {error}
                        </div>
                    )}
                    <div className="rounded-md shadow-sm space-y-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                                placeholder="Email hoặc tên đăng nhập"
                            />
                        </div>
                        {errors.loginId && touched.loginId && (
                            <p className="text-red-500 text-xs mt-1">{errors.loginId}</p>
                        )}

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                                placeholder="Mật khẩu"
                            />
                        </div>
                        {errors.password && touched.password && (
                            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                        )}
                    </div>

                    {/* Captcha */}
                    <div>
                        <Captcha 
                            onChange={setCaptchaToken} 
                            error={!!(errors.captcha && touched.captcha)}
                        />
                        {errors.captcha && touched.captcha && (
                            <p className="text-red-500 text-xs mt-1 text-center">{errors.captcha}</p>
                        )}
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
                        >
                            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
