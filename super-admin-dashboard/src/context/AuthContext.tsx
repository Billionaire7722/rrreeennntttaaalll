import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface UserPayload {
    sub: string;
    name: string;
    username: string;
    role: string;
    exp: number;
}

interface AuthContextType {
    user: UserPayload | null;
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserPayload | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            try {
                const decoded = jwtDecode<UserPayload>(storedToken);
                if (decoded.exp * 1000 > Date.now() && decoded.role === 'SUPER_ADMIN') {
                    // Avoid triggering setState on mount if token is already known contextually
                    setToken(t => t === storedToken ? t : storedToken);
                    setUser(u => u?.sub === decoded.sub ? u : decoded);
                } else {
                    localStorage.removeItem('token');
                }
            } catch {
                localStorage.removeItem('token');
            }
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string) => {
        try {
            const decoded = jwtDecode<UserPayload>(newToken);
            if (decoded.role === 'SUPER_ADMIN') {
                localStorage.setItem('token', newToken);
                setToken(newToken);
                setUser(decoded);
            } else {
                alert('Unauthorized: Missing SUPER_ADMIN privileges.');
                logout();
            }
        } catch {
            console.error('Invalid token format');
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
