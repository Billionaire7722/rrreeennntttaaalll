"use client";

import React, { createContext, useCallback, useEffect, useMemo, useState, ReactNode } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import api, {
    AUTH_STATE_CHANGED_EVENT,
    clearStoredAuthTokens,
    getStoredAccessToken,
    getStoredRefreshToken,
    refreshAccessToken,
    resolvedApiBaseUrl,
    setStoredAuthTokens,
} from '../api/axios';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    username: string;
    email: string;
    phone: string;
    name: string;
    firstName?: string;
    lastName?: string;
    role: string;
}

interface TokenPayload {
    sub: string;
    username: string;
    email: string;
    phone: string;
    name: string;
    firstName?: string;
    lastName?: string;
    role: string;
    exp: number;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (loginId: string, password: string, captchaToken: string) => Promise<void>;
    register: (data: RegisterPayload) => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
}

interface RegisterPayload {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    password: string;
    confirmPassword: string;
    captchaToken: string;
}

type AuthResponse = {
    access_token: string;
    refresh_token: string;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeUserFromToken(token: string | null): User | null {
    if (!token) return null;

    try {
        const decoded = jwtDecode<TokenPayload>(token);
        if (decoded.exp * 1000 <= Date.now() || decoded.role !== 'USER') {
            return null;
        }

        return {
            id: decoded.sub,
            username: decoded.username,
            email: decoded.email,
            phone: decoded.phone,
            name: decoded.name,
            firstName: decoded.firstName,
            lastName: decoded.lastName,
            role: decoded.role,
        };
    } catch {
        return null;
    }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const applyToken = useCallback((nextToken: string | null) => {
        const nextUser = decodeUserFromToken(nextToken);
        setToken(nextUser ? nextToken : null);
        setUser(nextUser);
        return nextUser;
    }, []);

    const syncSession = useCallback(async () => {
        const storedToken = getStoredAccessToken();
        if (storedToken) {
            const nextUser = applyToken(storedToken);
            if (nextUser) {
                return nextUser;
            }
        }

        if (getStoredRefreshToken()) {
            const refreshedToken = await refreshAccessToken();
            if (refreshedToken) {
                return applyToken(refreshedToken);
            }
        }

        clearStoredAuthTokens();
        applyToken(null);
        return null;
    }, [applyToken]);

    useEffect(() => {
        let cancelled = false;

        const bootstrap = async () => {
            const nextUser = await syncSession();
            if (!cancelled) {
                setUser(nextUser);
                setLoading(false);
            }
        };

        bootstrap();

        return () => {
            cancelled = true;
        };
    }, [syncSession]);

    useEffect(() => {
        const syncFromStorage = () => {
            const storedToken = getStoredAccessToken();
            applyToken(storedToken);
        };

        const handleStorage = (event: StorageEvent) => {
            if (event.key === 'token' || event.key === 'refresh_token' || event.key === null) {
                syncFromStorage();
            }
        };

        window.addEventListener(AUTH_STATE_CHANGED_EVENT, syncFromStorage);
        window.addEventListener('storage', handleStorage);

        return () => {
            window.removeEventListener(AUTH_STATE_CHANGED_EVENT, syncFromStorage);
            window.removeEventListener('storage', handleStorage);
        };
    }, [applyToken]);

    useEffect(() => {
        if (!token) return;

        const decoded = jwtDecode<TokenPayload>(token);
        const refreshAt = decoded.exp * 1000 - Date.now() - 60 * 1000;
        const timeout = window.setTimeout(() => {
            refreshAccessToken().catch(() => {});
        }, Math.max(refreshAt, 5_000));

        return () => {
            window.clearTimeout(timeout);
        };
    }, [token]);

    useEffect(() => {
        if (!token || !user) return;

        const sendHeartbeat = () => {
            api.post('/presence/heartbeat').catch(() => {});
        };

        sendHeartbeat();
        const interval = window.setInterval(sendHeartbeat, 15_000);

        const onBeforeUnload = () => {
            try {
                fetch(`${api.defaults.baseURL}/presence/offline`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    keepalive: true,
                });
            } catch {
                // Ignore unload failures.
            }
        };

        window.addEventListener('beforeunload', onBeforeUnload);
        return () => {
            window.clearInterval(interval);
            window.removeEventListener('beforeunload', onBeforeUnload);
        };
    }, [token, user]);

    const persistSession = useCallback((response: AuthResponse) => {
        setStoredAuthTokens({
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
        });
        applyToken(response.access_token);
    }, [applyToken]);

    const login = useCallback(async (loginId: string, password: string, captchaToken: string) => {
        const res = await api.post<AuthResponse>('/auth/login', { loginId, password, captchaToken });
        persistSession(res.data);
        router.push('/');
    }, [persistSession, router]);

    const register = useCallback(async (data: RegisterPayload) => {
        const res = await api.post<AuthResponse>('/auth/register', data);
        persistSession(res.data);
        router.push('/');
    }, [persistSession, router]);

    const logout = useCallback(async () => {
        const refreshToken = getStoredRefreshToken();

        try {
            await Promise.allSettled([
                api.post('/presence/offline'),
                refreshToken
                    ? axios.post(`${resolvedApiBaseUrl}/auth/logout`, { refreshToken })
                    : Promise.resolve(),
            ]);
        } finally {
            clearStoredAuthTokens();
            applyToken(null);
            router.push('/login');
        }
    }, [applyToken, router]);

    const value = useMemo(
        () => ({ user, token, login, register, logout, loading }),
        [user, token, login, register, logout, loading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
