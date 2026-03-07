"use client";

import { useContext } from 'react';
import { AuthContext } from './AuthContext';

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        // Safe fallback for SSR / pre-render (no provider available)
        return {
            user: null, token: null, loading: false,
            login: async () => { }, register: async () => { }, logout: () => { },
        } as any;
    }
    return context;
};
