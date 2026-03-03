"use client";

import { useEffect, useState, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/context/useAuth';
import { Send, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/api/axios';

interface Message {
    id: string;
    content: string;
    senderId: string;
    senderRole: string;
    created_at: string;
    user?: {
        id: string;
        name: string;
        email: string;
    };
}

export default function ChatPage() {
    const { user } = useAuth();
    const { socket, isConnected, sendMessage } = useSocket();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch existing messages
    const fetchMessages = async () => {
        try {
            const res = await api.get('/users/messages');
            setMessages(res.data || []);
        } catch (err) {
            console.error('Failed to fetch messages', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchMessages();
        }
    }, [user]);

    // Listen for incoming messages via WebSocket
    useEffect(() => {
        if (!socket) return;

        socket.on('new_message', (message: Message) => {
            setMessages(prev => [message, ...prev]);
        });

        socket.on('message_sent', (message: Message) => {
            setMessages(prev => [message, ...prev]);
        });

        return () => {
            socket.off('new_message');
            socket.off('message_sent');
        };
    }, [socket]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket || !isConnected) return;

        // Send via WebSocket
        sendMessage(newMessage.trim(), '');
        
        // Also save to database via REST API (for persistence)
        try {
            await api.post('/users/messages', { content: newMessage.trim() });
        } catch (err) {
            console.error('Failed to save message', err);
        }

        setNewMessage('');
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md text-center">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Vui lòng đăng nhập</h2>
                    <p className="text-gray-500 mb-6">Bạn cần đăng nhập để nhắn tin với quản trị viên.</p>
                    <Link href="/login" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition">
                        Đăng nhập
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto flex items-center gap-3">
                    <Link href="/profile" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900">Hỗ trợ</h1>
                            <p className="text-xs text-gray-500">
                                {isConnected ? 'Đang hoạt động' : 'Đang kết nối...'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-2xl mx-auto space-y-4">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                            <p className="text-gray-500 mt-2">Đang tải tin nhắn...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Send className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">Chưa có tin nhắn</h3>
                            <p className="text-gray-500 text-sm">Gửi tin nhắn cho quản trị viên để được hỗ trợ</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isOwn = msg.senderId === user.id;
                            return (
                                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] ${isOwn ? 'order-2' : 'order-1'}`}>
                                        <div className={`rounded-2xl px-4 py-3 ${
                                            isOwn 
                                                ? 'bg-blue-600 text-white rounded-br-md' 
                                                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                                        }`}>
                                            <p className="text-sm">{msg.content}</p>
                                        </div>
                                        <p className={`text-xs text-gray-400 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                                            {msg.senderRole === 'ADMIN' || msg.senderRole === 'SUPER_ADMIN' 
                                                ? 'Quản trị viên' 
                                                : isOwn ? 'Bạn' : 'Người dùng'
                                            }
                                            {' · '}
                                            {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="bg-white border-t border-gray-200 px-4 py-3">
                <form onSubmit={handleSend} className="max-w-2xl mx-auto flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || !isConnected}
                        className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
