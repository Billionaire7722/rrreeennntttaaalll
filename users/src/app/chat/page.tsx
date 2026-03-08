"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/context/useAuth";
import { Send, User, ArrowLeft, MoreVertical, Search, Check, CheckCheck, Home, ChevronLeft, MapPin } from "lucide-react";
import Link from "next/link";
import api from "@/api/axios";
import { useSearchParams, useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string | null;
  senderRole: string;
  created_at: string;
  seen_at?: string | null;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
}

interface Conversation {
  otherUser: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  lastMessage: Message;
  unreadCount: number;
}

function getInitials(name: string): string {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function formatChatTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  } else if (diffDays < 7) {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return days[date.getDay()];
  } else {
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  }
}

function ChatPageContent() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(searchParams.get("recipientId"));
  const [searchTerm, setSearchTerm] = useState("");
  const [recipientUser, setRecipientUser] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasSentInitialRef = useRef(false);

  const targetHouseId = searchParams.get("houseId");
  const targetHouseTitle = searchParams.get("houseTitle");

  // Fetch conversations list
  const fetchConversations = async () => {
    try {
      const res = await api.get("/users/conversations");
      setConversations(res.data);
    } catch (err) {
      console.error("Failed to fetch conversations", err);
    } finally {
      setLoadingConv(false);
    }
  };

  // Fetch messages for selected user
  const fetchMessages = async (otherId: string) => {
    setLoadingMsgs(true);
    try {
      const res = await api.get(`/users/messages/${otherId}`);
      setMessages(res.data || []);
      
      // Mark as seen
      await api.post(`/users/messages/${otherId}/seen`);
      
      // Locally update unread count in conversations list
      setConversations(prev => prev.map(c => 
        c.otherUser.id === otherId ? { ...c, unreadCount: 0 } : c
      ));

    } catch (err) {
      console.error("Failed to fetch messages", err);
    } finally {
      setLoadingMsgs(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedUserId && user) {
      fetchMessages(selectedUserId);
      // If not in conversations, fetch public info to show in header
      const inList = conversations.find(c => c.otherUser.id === selectedUserId);
      if (!inList) {
        api.get(`/users/public/${selectedUserId}`).then(res => {
          setRecipientUser(res.data);
        }).catch(err => console.error("Failed to fetch recipient info", err));
      } else {
        setRecipientUser(null);
      }
    } else {
      setMessages([]);
      setRecipientUser(null);
    }
  }, [selectedUserId, user, conversations.length]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: Message) => {
      // If it's for the current thread, add to messages
      if (
        (msg.senderId === selectedUserId && msg.receiverId === user?.id) ||
        (msg.senderId === user?.id && msg.receiverId === selectedUserId)
      ) {
        setMessages(prev => [...prev, msg]);
        if (msg.senderId === selectedUserId) {
           api.post(`/users/messages/${selectedUserId}/seen`).catch(() => {});
        }
      }

      // Update conversations list
      setConversations(prev => {
        const otherId = msg.senderId === user?.id ? msg.receiverId : msg.senderId;
        if (!otherId) return prev;

        const existing = prev.find(c => c.otherUser.id === otherId);
        const isSelected = selectedUserId === otherId;
        
        if (existing) {
          const updated = {
            ...existing,
            lastMessage: msg,
            unreadCount: (!isSelected && msg.senderId === otherId) ? existing.unreadCount + 1 : 0
          };
          return [updated, ...prev.filter(c => c.otherUser.id !== otherId)];
        } else {
          // New conversation! Use the 'user' info from payload
          const newUser = msg.senderId === user?.id ? (recipientUser || { id: msg.receiverId, name: "User", avatarUrl: null }) : (msg.user || { id: msg.senderId, name: "User", avatarUrl: null });
          const newConv: Conversation = {
            otherUser: {
              id: newUser.id,
              name: newUser.name,
              avatarUrl: newUser.avatarUrl
            },
            lastMessage: msg,
            unreadCount: (!isSelected && msg.senderId === otherId) ? 1 : 0
          };
          return [newConv, ...prev];
        }
      });
    };

    socket.on("new_message", handleNewMessage);
    socket.on("message_sent", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("message_sent", handleNewMessage);
    };
  }, [socket, selectedUserId, user?.id]);

  // Initial contact message
  useEffect(() => {
    if (!user || hasSentInitialRef.current || !selectedUserId || !targetHouseId) return;

    hasSentInitialRef.current = true;
    const initialMessage = `Xin chào, tôi muốn liên hệ về tin đăng \"${targetHouseTitle || targetHouseId}\" (ID: ${targetHouseId}).`;

    api.post("/users/messages", {
      content: initialMessage,
      recipientId: selectedUserId,
      houseId: targetHouseId,
      houseTitle: targetHouseTitle,
    }).catch(err => console.error("Failed to send initial message", err));

  }, [user, selectedUserId, targetHouseId, targetHouseTitle]);

  useEffect(() => {
    if (!loadingMsgs && messages.length > 0) {
      // Small timeout to ensure DOM has updated with new bubbles
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages, loadingMsgs, selectedUserId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId || !user) return;

    const content = newMessage.trim();
    setNewMessage("");

    try {
      await api.post("/users/messages", {
        content,
        recipientId: selectedUserId,
      });
      // The socket 'message_sent' will handle local update
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter(c => 
      c.otherUser.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [conversations, searchTerm]);

  const selectedConversation = conversations.find(c => c.otherUser.id === selectedUserId);
  const displayUser = selectedConversation?.otherUser || (recipientUser ? { id: recipientUser.id, name: recipientUser.name, avatarUrl: recipientUser.avatarUrl } : null);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('please_sign_in')}</h2>
          <p className="text-gray-500 mb-6">{t('chat_sign_in_required')}</p>
          <Link href="/login" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition">
            {t('sign_in_link')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden group/chat">
      {/* Sidebar - Conversation List */}
      <div className={`w-full md:w-[360px] flex-shrink-0 border-r border-gray-100 flex flex-col transition-all ${selectedUserId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-50 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link 
                href="/profile" 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                title="Về Profile"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700 group-hover:-translate-x-0.5 transition-transform" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Chat</h1>
            </div>
            <div className="flex gap-1.5 items-center">
               <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-gray-300"}`}></div>
               <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{isConnected ? "Online" : "Offline"}</span>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-100 transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar pb-20">
          {loadingConv ? (
             <div className="p-4 space-y-4">
               {[1,2,3,4].map(i => (
                 <div key={i} className="flex gap-3 animate-pulse">
                   <div className="w-12 h-12 bg-gray-100 rounded-full" />
                   <div className="flex-1 space-y-2 mt-1">
                     <div className="h-3 bg-gray-100 rounded w-1/2" />
                     <div className="h-3 bg-gray-100 rounded w-3/4" />
                   </div>
                 </div>
               ))}
             </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400 text-sm">{t('no_conversations')}</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedUserId === conv.otherUser.id;
              const isUnread = conv.unreadCount > 0;
              return (
                <button
                  key={conv.otherUser.id}
                  onClick={() => {
                    setSelectedUserId(conv.otherUser.id);
                    // On mobile, this will hide the list and show chat
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors relative group ${isSelected ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="relative flex-shrink-0">
                    {conv.otherUser.avatarUrl ? (
                      <img src={conv.otherUser.avatarUrl} alt={conv.otherUser.name} className="w-14 h-14 rounded-full object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold">
                        {getInitials(conv.otherUser.name)}
                      </div>
                    )}
                    {/* Active dot could go here if we had presence for all users */}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className={`text-[15px] font-semibold truncate ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                        {conv.otherUser.name}
                      </h3>
                      <span className="text-[11px] text-gray-400 font-medium">
                        {formatChatTime(conv.lastMessage.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                       <p className={`text-sm truncate ${isUnread ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                         {conv.lastMessage.senderId === user.id && "Bạn: "}{conv.lastMessage.content}
                       </p>
                       {isUnread && (
                         <div className="w-2.5 h-2.5 bg-blue-600 rounded-full flex-shrink-0" />
                       )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col min-w-0 bg-white transition-all ${!selectedUserId ? 'hidden md:flex' : 'flex'}`}>
        {selectedUserId && displayUser ? (
          <>
            {/* Chat Header */}
            <div className="h-[72px] border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-10 transition-all">
              <div className="flex items-center gap-1 sm:gap-3 min-w-0">
                <div className="flex items-center">
                  <button 
                    onClick={() => setSelectedUserId(null)}
                    className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="DASHBOARD"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <Link 
                    href="/profile"
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 group"
                    title="Về Profile"
                  >
                    <ChevronLeft className="w-6 h-6 group-hover:text-blue-600 transition-colors" />
                  </Link>
                </div>
                
                <Link href={`/user/${displayUser.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity min-w-0">
                   {displayUser.avatarUrl ? (
                     <img src={displayUser.avatarUrl} alt={displayUser.name} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-gray-50 flex-shrink-0" />
                   ) : (
                     <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                       {getInitials(displayUser.name)}
                     </div>
                   )}
                   <div className="min-w-0">
                     <h2 className="font-bold text-gray-900 truncate tracking-tight text-sm sm:text-base">{displayUser.name}</h2>
                     <p className="text-[10px] sm:text-[11px] text-green-500 font-semibold leading-none flex items-center gap-1">
                       <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                       Trực tuyến
                     </p>
                   </div>
                </Link>
              </div>
              <div className="flex items-center gap-3">
                 {targetHouseId && (
                   <Link 
                     href={`/properties/${targetHouseId}`}
                     className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-full border border-gray-100 transition-colors text-xs font-semibold text-gray-700"
                   >
                     <MapPin className="w-3 h-3 text-red-500" />
                     {targetHouseTitle || "Xem nhà"}
                   </Link>
                 )}
                 <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                 </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 hide-scrollbar bg-gray-50/30">
              {loadingMsgs ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                   <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent animate-spin rounded-full" />
                   <span className="text-xs font-medium">Loading messages...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                   <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                      <User className="w-10 h-10 text-blue-200" />
                   </div>
                   <h3 className="font-bold text-gray-800 mb-1">Hãy bắt đầu cuộc trò chuyện</h3>
                   <p className="text-sm text-gray-400 max-w-[200px]">Gửi lời chào tới {displayUser.name}</p>
                </div>
              ) : (
                <div className="space-y-6">
                   {messages.map((msg, idx) => {
                     const isOwn = msg.senderId === user.id;
                     const nextMsg = messages[idx + 1];
                     const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;
                     const showTime = !nextMsg || (new Date(nextMsg.created_at).getTime() - new Date(msg.created_at).getTime() > 1000 * 60 * 30);

                     return (
                       <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                          <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[70%] group`}>
                             {!isOwn && isLastInGroup && (
                                <div className="w-7 h-7 flex-shrink-0 mb-1">
                                   {displayUser.avatarUrl ? (
                                      <img src={displayUser.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                                   ) : (
                                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                                         {getInitials(displayUser.name)}
                                      </div>
                                   )}
                                </div>
                             )}
                             {!isOwn && !isLastInGroup && <div className="w-7 flex-shrink-0" />}
                             
                             <div className="flex flex-col">
                                <div className={`px-4 py-2.5 rounded-[20px] text-[15px] leading-relaxed break-words shadow-sm ${
                                  isOwn 
                                    ? 'bg-blue-600 text-white rounded-br-none' 
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                }`}>
                                   {msg.content}
                                </div>
                             </div>
                          </div>

                          <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} mt-1 px-1`}>
                             {showTime && (
                               <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                  {new Date(msg.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                               </span>
                             )}
                             {isOwn && idx === messages.length - 1 && (
                                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium uppercase tracking-tighter mt-0.5">
                                   {msg.seen_at ? <CheckCheck size={12} className="text-blue-500" /> : <Check size={12} />}
                                   {msg.seen_at ? 'Đã xem' : 'Đã gửi'}
                                </div>
                             )}
                          </div>
                       </div>
                     );
                   })}
                   <div ref={messagesEndRef} className="h-4" />
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 sm:p-6 border-t border-gray-100 flex-shrink-0 bg-white">
              <form onSubmit={handleSend} className="flex items-end gap-3 max-w-4xl mx-auto ring-1 ring-gray-100 p-1.5 rounded-[28px] focus-within:ring-2 focus-within:ring-blue-100 bg-gray-50 transition-all">
                <input 
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('type_message')}
                  className="flex-1 bg-transparent border-none outline-none px-4 py-2.5 text-[15px] text-gray-800 placeholder:text-gray-400 focus:ring-0"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-30 disabled:hover:bg-blue-600 transition-all duration-200 transform active:scale-90 shadow-md"
                >
                  <Send className="w-5 h-5 ml-0.5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50/20">
             <div className="w-24 h-24 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6 transform rotate-3">
                <User className="w-12 h-12 text-blue-100" />
             </div>
             <h2 className="text-xl font-bold text-gray-900 mb-2">Chọn một cuộc trò chuyện</h2>
             <p className="text-gray-400 text-sm max-w-xs text-center">Messenger phong cách mới, kết nối ngay với chủ nhà và khách hàng của bạn.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent animate-spin rounded-full" />
    </div>}>
      <ChatPageContent />
    </Suspense>
  );
}
