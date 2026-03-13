import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import css from './Login.module.css';
import api from '../api/axios';

export const Login: React.FC = () => {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // If already authenticated, redirect to home or intended page
    React.useEffect(() => {
        if (isAuthenticated) {
            const from = (location.state as any)?.from?.pathname || '/';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, location]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await api.post('/admin/auth/login', { loginId, password });
            login(response.data.access_token);
            // AuthContext will update and triggering the useEffect redirect above
        } catch (err: any) {
            console.error('Login failed:', err);
            setError(err.response?.data?.message || 'Invalid credentials or server error.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={css.loginPage}>
            <div className={css.loginCard + " glass-panel"}>
                <div className={css.header}>
                    <div className={css.logoIcon}>
                        <ShieldCheck size={32} />
                    </div>
                    <h1>SuperAdmin</h1>
                    <p>Enter your credentials to access the command center</p>
                </div>

                {error && (
                    <div className={css.errorAlert}>
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className={css.form}>
                    <div className={css.inputGroup}>
                        <label htmlFor="loginId">Email or Username</label>
                        <div className={css.inputWrapper}>
                            <Mail className={css.fieldIcon} size={18} />
                            <input
                                id="loginId"
                                type="text"
                                className="input-field"
                                placeholder="admin@example.com"
                                value={loginId}
                                onChange={(e) => setLoginId(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className={css.inputGroup}>
                        <label htmlFor="password">Password</label>
                        <div className={css.inputWrapper}>
                            <Lock className={css.fieldIcon} size={18} />
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                className="input-field"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className={css.passwordToggle}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center', height: '42px', marginTop: '8px' }}
                        disabled={loading}
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};
