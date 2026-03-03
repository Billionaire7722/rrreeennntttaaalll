"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/useAuth';
import Link from 'next/link';
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

// Password validation rules
const passwordRules = [
    { id: 'length', label: '8-12 ký tự', test: (p: string) => p.length >= 8 && p.length <= 12 },
    { id: 'uppercase', label: 'Chữ hoa (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
    { id: 'lowercase', label: 'Chữ thường (a-z)', test: (p: string) => /[a-z]/.test(p) },
    { id: 'number', label: 'Số (0-9)', test: (p: string) => /\d/.test(p) },
    { id: 'special', label: 'Ký tự đặc biệt (@$!%*?&)', test: (p: string) => /[@$!%*?&]/.test(p) },
];

export default function RegisterPage() {
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        name: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // Real-time password validation
    const passwordValidations = passwordRules.map(rule => ({
        ...rule,
        valid: rule.test(formData.password)
    }));

    const isPasswordValid = passwordValidations.every(v => v.valid);

    // Validate individual field
    const validateField = (name: string, value: string): string | undefined => {
        switch (name) {
            case 'name':
                if (!value.trim()) return 'Vui lòng nhập họ tên';
                break;
            case 'username':
                if (!value.trim()) return 'Vui lòng nhập tên đăng nhập';
                if (value.length < 3) return 'Tên đăng nhập phải có ít nhất 3 ký tự';
                break;
            case 'email':
                if (!value.trim()) return 'Vui lòng nhập email';
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email không hợp lệ';
                break;
            case 'phone':
                if (!value.trim()) return 'Vui lòng nhập số điện thoại';
                break;
            case 'password':
                if (!value) return 'Vui lòng nhập mật khẩu';
                if (!isPasswordValid) return 'Mật khẩu không đủ mạnh';
                break;
            case 'confirmPassword':
                if (!value) return 'Vui lòng xác nhận mật khẩu';
                if (value !== formData.password) return 'Mật khẩu xác nhận không khớp';
                break;
        }
        return undefined;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
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
        
        Object.keys(formData).forEach(key => {
            const fieldError = validateField(key, formData[key as keyof typeof formData]);
            if (fieldError) {
                newErrors[key as keyof FormErrors] = fieldError;
                hasErrors = true;
            }
        });

        // Validate captcha
        if (!captchaToken) {
            newErrors.captcha = 'Vui lòng xác nhận captcha';
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
            captcha: true
        });

        if (hasErrors) return;

        setLoading(true);
        try {
            await register({
                username: formData.username,
                email: formData.email,
                name: formData.name,
                phone: formData.phone,
                password: formData.password,
                confirmPassword: formData.confirmPassword
            });
        } catch (err: any) {
            // Handle specific error messages from backend
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Đăng ký thất bại. Vui lòng thử lại.';
            
            // Check for duplicate email/username
            if (errorMessage.includes('email') || errorMessage.includes('Email đã')) {
                setErrors(prev => ({ ...prev, email: errorMessage }));
            } else if (errorMessage.includes('tên đăng nhập') || errorMessage.includes('username')) {
                setErrors(prev => ({ ...prev, username: errorMessage }));
            } else if (errorMessage.includes('mật khẩu')) {
                setErrors(prev => ({ ...prev, password: errorMessage }));
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
                        Tạo tài khoản mới
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Đã có tài khoản?{' '}
                        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                            Đăng nhập ngay
                        </Link>
                    </p>
                </div>
                <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm text-center">
                            {error}
                        </div>
                    )}
                    <div className="rounded-md shadow-sm space-y-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                                placeholder="Họ và tên"
                            />
                        </div>
                        {errors.name && touched.name && (
                            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                        )}

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                                placeholder="Tên đăng nhập"
                            />
                        </div>
                        {errors.username && touched.username && (
                            <p className="text-red-500 text-xs mt-1">{errors.username}</p>
                        )}

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                                placeholder="Địa chỉ email"
                            />
                        </div>
                        {errors.email && touched.email && (
                            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                        )}

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                                placeholder="Số điện thoại"
                            />
                        </div>
                        {errors.phone && touched.phone && (
                            <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                                    placeholder="Mật khẩu"
                                />
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                                    placeholder="Xác nhận mật khẩu"
                                />
                            </div>
                        </div>
                        {errors.password && touched.password && (
                            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                        )}
                        {errors.confirmPassword && touched.confirmPassword && (
                            <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                        )}

                        {/* Password requirements */}
                        {formData.password && (
                            <div className="bg-gray-50 p-3 rounded-lg text-xs space-y-1">
                                <p className="font-medium text-gray-700 mb-2">Yêu cầu mật khẩu:</p>
                                {passwordValidations.map((rule) => (
                                    <div key={rule.id} className={`flex items-center ${rule.valid ? 'text-green-600' : 'text-gray-500'}`}>
                                        <span className="mr-2">{rule.valid ? '✓' : '○'}</span>
                                        {rule.label}
                                    </div>
                                ))}
                            </div>
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
                            {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
