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

        const socketInstance = io(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/messages`, {
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
