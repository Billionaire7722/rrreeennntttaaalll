"use client";

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/context/useAuth';
import { Send, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/api/axios';
import { useSearchParams } from 'next/navigation';

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

function ChatPageContent() {
    const { user } = useAuth();
    const { socket, isConnected } = useSocket();
    const searchParams = useSearchParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const hasSentInitialRef = useRef(false);

    const targetAdminId = searchParams.get('adminId') || undefined;
    const targetHouseId = searchParams.get('houseId') || undefined;
    const targetHouseTitle = searchParams.get('houseTitle') || undefined;

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

    useEffect(() => {
        if (!user || hasSentInitialRef.current || !targetAdminId || !targetHouseId) return;

        hasSentInitialRef.current = true;
        const initialMessage = `Xin chao, toi muon lien he ve tin dang "${targetHouseTitle || targetHouseId}" (ID: ${targetHouseId}).`;

        api.post('/users/messages', {
            content: initialMessage,
            recipientId: targetAdminId,
            houseId: targetHouseId,
            houseTitle: targetHouseTitle,
        }).catch((err) => {
            console.error('Failed to send initial contact message', err);
        });
    }, [user, targetAdminId, targetHouseId, targetHouseTitle]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await api.post('/users/messages', {
                content: newMessage.trim(),
                recipientId: targetAdminId,
                houseId: targetHouseId,
                houseTitle: targetHouseTitle,
            });
            setMessages((prev) => [
                {
                    id: `tmp-${Date.now()}`,
                    content: newMessage.trim(),
                    senderId: user?.id || '',
                    senderRole: 'VIEWER',
                    created_at: new Date().toISOString(),
                },
                ...prev,
            ]);
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
            <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/profile" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shadow-inner">
                                <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="font-bold text-gray-900 leading-tight">Hỗ trợ</h1>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                    <span className="text-xs text-gray-500 font-medium">
                                        {isConnected ? 'Đang hoạt động' : 'Đang kết nối...'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-32 scroll-smooth">
                <div className="max-w-3xl mx-auto space-y-6">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                            <p className="text-gray-500 mt-2 text-sm">Đang tải tin nhắn...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Send className="w-8 h-8 text-blue-300 ml-1" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Bắt đầu cuộc trò chuyện</h3>
                            <p className="text-gray-500 text-sm max-w-sm mx-auto">Gửi tin nhắn cho quản trị viên để giải đáp thắc mắc về bất động sản này.</p>
                        </div>
                    ) : (
                        messages.slice().reverse().map((msg, index) => {
                            const isOwn = msg.senderId === user.id;
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} animate-[fadeInUp_0.3s_ease-out_forwards]`}
                                    style={{
                                        animationName: 'fadeInUp',
                                        animationDuration: '300ms',
                                        animationFillMode: 'both'
                                    }}
                                >
                                    <style dangerouslySetInnerHTML={{
                                        __html: `
                                      @keyframes fadeInUp {
                                        from { opacity: 0; transform: translateY(10px); }
                                        to { opacity: 1; transform: translateY(0); }
                                      }
                                    `}} />
                                    <div className={`flex gap-3 max-w-[85%] sm:max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>

                                        {/* Avatar for other users */}
                                        {!isOwn && (
                                            <div className="flex-shrink-0 self-end mb-5">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-100 flex items-center justify-center shadow-sm overflow-hidden">
                                                    <User className="w-4 h-4 text-gray-500" />
                                                </div>
                                            </div>
                                        )}

                                        {/* Message Bubble */}
                                        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                                            {!isOwn && (
                                                <span className="text-xs text-gray-500 mb-1 ml-1 font-medium">
                                                    {msg.senderRole === 'ADMIN' || msg.senderRole === 'SUPER_ADMIN' ? 'Quản trị viên' : 'Người dùng'}
                                                </span>
                                            )}
                                            <div className={`relative px-4 py-3 shadow-sm ${isOwn
                                                    ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm'
                                                    : 'bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-bl-sm'
                                                }`}>
                                                <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                                            </div>
                                            <span className={`text-[11px] text-gray-400 mt-1.5 ${isOwn ? 'mr-1' : 'ml-1'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Fixed Input Area */}
            <div className="bg-white border-t border-gray-100 px-4 py-3 sm:py-4 fixed bottom-0 left-0 right-0 z-20 shadow-[0_-4px_20px_rgb(0,0,0,0.03)]">
                <form onSubmit={handleSend} className="max-w-3xl mx-auto flex items-end gap-2 relative">
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-[24px] focus-within:bg-white focus-within:border-blue-400 focus-within:ring-2 disabled:opacity-70 focus-within:ring-blue-100 flex items-center p-1.5 shadow-sm transition-all">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Nhập tin nhắn..."
                            className="flex-1 w-full bg-transparent border-none outline-none px-4 py-2 text-[15px] text-gray-800 placeholder:text-gray-400 focus:ring-0"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(e);
                                }
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="flex-shrink-0 w-10 h-10 ml-2 rounded-full flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-white transition-colors duration-200 shadow-sm"
                        >
                            <Send className="w-5 h-5 ml-0.5" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Loading chat...</div>}>
            <ChatPageContent />
        </Suspense>
    );
}
