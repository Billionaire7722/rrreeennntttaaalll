import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { AxiosError } from 'axios';
import { useAuth } from '../context/useAuth';
import api from '../api/axios';
import css from './Login.module.css';

export const Login: React.FC = () => {
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { loginId, password });
            login(response.data.access_token);
            navigate('/');
        } catch (err) {
            const error = err as AxiosError<{ message?: string }>;
            if (!error.response) {
                setError('Cannot reach backend API. Please verify deployment/API URL.');
            } else if (error.response.status === 401) {
                setError('Login failed. Please verify credentials.');
            } else {
                setError(error.response.data?.message || 'Login failed. Please verify credentials.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={css.container}>
            <div className={`glass-panel ${css.loginBox}`}>
                <div className={css.header}>
                    <ShieldCheck size={48} className={css.icon} />
                    <h2>Super Admin Console</h2>
                    <p>Strictly authoritative access only.</p>
                </div>

                {error && <div className={css.errorBox}>{error}</div>}

                <form onSubmit={handleLogin} className={css.form}>
                    <div className={css.field}>
                        <label>Username or Email</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="admin@example.com"
                            value={loginId}
                            onChange={(e) => setLoginId(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className={css.field}>
                        <label>Password</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className={`btn btn-primary ${css.submitBtn}`} disabled={loading || !loginId || !password}>
                        {loading ? <Loader2 className={css.spinner} size={20} /> : 'Authenticate Session'}
                    </button>
                </form>
            </div>
        </div>
    );
};
