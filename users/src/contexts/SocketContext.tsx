'use client';

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { resolveSocketBaseUrl } from '../api/axios';

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

export function SocketProvider({ children }: { children: ReactNode }) {
    const authContext = useContext(AuthContext);
    const token = authContext?.token;
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!token) {
            socketRef.current?.disconnect();
            socketRef.current = null;
            return;
        }

        const socketInstance = io(`${resolveSocketBaseUrl()}/messages`, {
            auth: { token },
            path: '/socket.io',
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        socketRef.current = socketInstance;

        socketInstance.on('connect', () => {
            console.log('Socket connected');
            setSocket(socketInstance);
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('Socket disconnected');
            if (socketRef.current === socketInstance) {
                setSocket(null);
            }
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setIsConnected(false);
        });

        return () => {
            socketInstance.disconnect();
            if (socketRef.current === socketInstance) {
                socketRef.current = null;
                setIsConnected(false);
            }
        };
    }, [token]);

    const sendMessage = (content: string, recipientId?: string) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('send_message', { content, recipientId });
        }
    };

    return (
        <SocketContext.Provider value={{ socket, isConnected, sendMessage }}>
            {children}
        </SocketContext.Provider>
    );
}
