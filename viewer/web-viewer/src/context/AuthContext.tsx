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
    login: (loginId: string, password: string) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => void;
    loading: boolean;
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
                if (decoded.exp * 1000 > Date.now()) {
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

    const login = async (loginId: string, password: string) => {
        const res = await api.post('/auth/login', { loginId, password });
        const { access_token } = res.data;
        const decoded: any = jwtDecode(access_token);

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

    const register = async (data: any) => {
        const res = await api.post('/auth/register', data);
        const { access_token } = res.data;
        const decoded: any = jwtDecode(access_token);

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
