'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    sendMessage: (content: string, recipientId?: string) => void;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    sendMessage: () => {},
});

export const useSocket = () => useContext(SocketContext);

const normalizeApiBaseUrl = (value?: string) => {
    if (!value) return '';
    const trimmed = value.trim();
    if (!trimmed) return '';

    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
    try {
        const url = new URL(candidate);
        if (!['http:', 'https:'].includes(url.protocol)) return '';
        if (url.username || url.password) return '';
        return `${url.origin}${url.pathname}`.replace(/\/+$/, '');
    } catch {
        return '';
    }
};

const resolveSocketBaseUrl = () => {
    const envUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
    if (envUrl) return envUrl;

    if (typeof window !== 'undefined' && window.location?.hostname) {
        return `${window.location.protocol}//${window.location.hostname}:3000`;
    }

    return 'http://localhost:3000';
};

export function SocketProvider({ children }: { children: ReactNode }) {
    const authContext = useContext(AuthContext);
    const token = authContext?.token;
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!token) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        const socketInstance = io(`${resolveSocketBaseUrl()}/messages`, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketInstance.on('connect', () => {
            console.log('Socket connected');
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setIsConnected(false);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [token]);

    const sendMessage = (content: string, recipientId?: string) => {
        if (socket && isConnected) {
            socket.emit('send_message', { content, recipientId });
        }
    };

    return (
        <SocketContext.Provider value={{ socket, isConnected, sendMessage }}>
            {children}
        </SocketContext.Provider>
    );
}
