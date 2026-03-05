"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axios';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    username: string;
    email: string;
    phone: string;
    name: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (loginId: string, password: string, captchaToken: string) => Promise<void>;
    register: (data: RegisterPayload) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

interface RegisterPayload {
    username: string;
    email: string;
    name: string;
    phone: string;
    password: string;
    confirmPassword: string;
    captchaToken: string;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            try {
                const decoded: any = jwtDecode(storedToken);
                if (decoded.exp * 1000 > Date.now() && decoded.role === 'VIEWER') {
                    setToken(storedToken);
                    setUser({
                        id: decoded.sub,
                        username: decoded.username,
                        email: decoded.email,
                        phone: decoded.phone,
                        name: decoded.name,
                        role: decoded.role,
                    });
                } else {
                    localStorage.removeItem('token');
                }
            } catch (e) {
                console.error("Invalid token");
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!token) return;

        const sendHeartbeat = () => {
            api.post('/presence/heartbeat').catch(() => { });
        };

        sendHeartbeat();
        const interval = setInterval(sendHeartbeat, 15000);

        const onBeforeUnload = () => {
            try {
                fetch(`${api.defaults.baseURL}/presence/offline`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ userId: user?.id }),
                    keepalive: true,
                });
            } catch {
                // ignore
            }
        };

        window.addEventListener('beforeunload', onBeforeUnload);
        return () => {
            clearInterval(interval);
            window.removeEventListener('beforeunload', onBeforeUnload);
        };
    }, [token, user?.id]);

    const login = async (loginId: string, password: string, captchaToken: string) => {
        const res = await api.post('/auth/login', { loginId, password, captchaToken });
        const { access_token } = res.data;
        const decoded: any = jwtDecode(access_token);
        if (decoded.role !== 'VIEWER') {
            throw new Error('This account is not allowed on viewer app.');
        }

        localStorage.setItem('token', access_token);
        setToken(access_token);
        setUser({
            id: decoded.sub,
            username: decoded.username,
            email: decoded.email,
            phone: decoded.phone,
            name: decoded.name,
            role: decoded.role,
        });
        router.push('/');
    };

    const register = async (data: RegisterPayload) => {
        const res = await api.post('/auth/register', data);
        const { access_token } = res.data;
        const decoded: any = jwtDecode(access_token);
        if (decoded.role !== 'VIEWER') {
            throw new Error('Registration is only for viewer accounts.');
        }

        localStorage.setItem('token', access_token);
        setToken(access_token);
        setUser({
            id: decoded.sub,
            username: decoded.username,
            email: decoded.email,
            phone: decoded.phone,
            name: decoded.name,
            role: decoded.role,
        });
        router.push('/');
    };

    const logout = () => {
        api.post('/presence/offline', { userId: user?.id }).catch(() => { });
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
