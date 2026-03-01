import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api';

export type User = {
    id: string;
    name: string;
    username: string;
    email?: string;
    role: 'ADMIN' | 'SUPER_ADMIN' | 'VIEWER' | 'GUEST' | string;
};

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string, user: User) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_USER_KEY = '@RentalAdmin:User';
const STORAGE_TOKEN_KEY = '@RentalAdmin:Token';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadAuth = async () => {
            try {
                const [storedUser, storedToken] = await Promise.all([
                    AsyncStorage.getItem(STORAGE_USER_KEY),
                    AsyncStorage.getItem(STORAGE_TOKEN_KEY),
                ]);

                if (storedUser && storedToken) {
                    const parsedUser = JSON.parse(storedUser) as User;
                    if (parsedUser.role === 'ADMIN' || parsedUser.role === 'SUPER_ADMIN') {
                        setUser(parsedUser);
                        setToken(storedToken);
                    } else {
                        await AsyncStorage.multiRemove([STORAGE_USER_KEY, STORAGE_TOKEN_KEY]);
                    }
                }
            } catch (e) {
                console.error('Failed to load auth state', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadAuth();
    }, []);

    useEffect(() => {
        if (!token || !user) return;

        const heartbeat = async () => {
            try {
                await fetch(`${API_BASE_URL}/presence/heartbeat`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
            } catch {
                // ignore
            }
        };

        heartbeat();
        const timer = setInterval(heartbeat, 15000);

        const handleBeforeUnload = () => {
            try {
                fetch(`${API_BASE_URL}/presence/offline`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId: user.id }),
                    keepalive: true,
                });
            } catch {
                // ignore
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', handleBeforeUnload);
        }

        return () => {
            clearInterval(timer);
            if (typeof window !== 'undefined') {
                window.removeEventListener('beforeunload', handleBeforeUnload);
            }
        };
    }, [token, user]);

    const login = async (nextToken: string, nextUser: User) => {
        if (nextUser.role !== 'ADMIN' && nextUser.role !== 'SUPER_ADMIN') {
            throw new Error('Only ADMIN/SUPER_ADMIN can use rental-admin.');
        }
        await AsyncStorage.multiSet([
            [STORAGE_USER_KEY, JSON.stringify(nextUser)],
            [STORAGE_TOKEN_KEY, nextToken],
        ]);
        setUser(nextUser);
        setToken(nextToken);
    };

    const logout = async () => {
        if (token && user) {
            try {
                await fetch(`${API_BASE_URL}/presence/offline`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId: user.id }),
                });
            } catch {
                // ignore
            }
        }
        await AsyncStorage.multiRemove([STORAGE_USER_KEY, STORAGE_TOKEN_KEY]);
        setUser(null);
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
