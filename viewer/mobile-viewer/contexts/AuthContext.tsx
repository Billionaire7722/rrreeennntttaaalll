import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

interface User {
    id: string;
    username: string;
    name: string;
    email: string;
    phone?: string;
}

interface AuthContextData {
    user: User | null;
    token: string | null;
    loading: boolean;
    signIn: (token: string, user: User) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStorageData = async () => {
            try {
                const storedToken = await AsyncStorage.getItem('@RentalViewer:Token');
                const storedUser = await AsyncStorage.getItem('@RentalViewer:User');

                if (storedToken && storedUser) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                    // Set default auth header
                    api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                }
            } catch (error) {
                console.error("Failed to load auth data", error);
            } finally {
                setLoading(false);
            }
        };

        loadStorageData();
    }, []);

    const signIn = async (newToken: string, newUser: User) => {
        await AsyncStorage.setItem('@RentalViewer:Token', newToken);
        await AsyncStorage.setItem('@RentalViewer:User', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    };

    const signOut = async () => {
        await AsyncStorage.removeItem('@RentalViewer:Token');
        await AsyncStorage.removeItem('@RentalViewer:User');
        setToken(null);
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
