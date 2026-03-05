"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/context/useAuth";
import { Send, User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import api from "@/api/axios";
import { useSearchParams } from "next/navigation";

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderRole: string;
  created_at: string;
  adminId?: string | null;
  seen_at?: string | null;
  seen_by_role?: string | null;
  admin?: {
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string | null;
  } | null;
}

function ChatPageContent() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(searchParams.get("adminId"));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasSentInitialRef = useRef(false);

  const targetHouseId = searchParams.get("houseId") || undefined;
  const targetHouseTitle = searchParams.get("houseTitle") || undefined;

  const conversations = useMemo(() => {
    const map = new Map<
      string,
      {
        adminId: string;
        adminName: string;
        latest: Message;
      }
    >();

    for (const msg of messages) {
      const adminId = msg.adminId || msg.admin?.id;
      if (!adminId) continue;
      const adminName = msg.admin?.name || msg.admin?.username || "Admin";
      const current = map.get(adminId);
      const currentTime = current ? new Date(current.latest.created_at).getTime() : 0;
      const msgTime = new Date(msg.created_at).getTime();
      if (!current || msgTime > currentTime) {
        map.set(adminId, { adminId, adminName, latest: msg });
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime()
    );
  }, [messages]);

  const threadMessages = useMemo(() => {
    if (!selectedAdminId) return [];
    return messages
      .filter((m) => (m.adminId || m.admin?.id) === selectedAdminId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [messages, selectedAdminId]);

  useEffect(() => {
    if (!selectedAdminId && conversations.length > 0) {
      setSelectedAdminId(conversations[0].adminId);
    }
  }, [conversations, selectedAdminId]);

  const fetchMessages = async () => {
    try {
      const res = await api.get("/users/messages");
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchMessages();
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    const onNew = (message: Message) => {
      setMessages((prev) => {
        if (prev.some((p) => p.id === message.id)) return prev;
        return [message, ...prev];
      });
    };

    socket.on("new_message", onNew);
    socket.on("message_sent", onNew);

    return () => {
      socket.off("new_message", onNew);
      socket.off("message_sent", onNew);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages]);

  useEffect(() => {
    if (!user || hasSentInitialRef.current || !selectedAdminId || !targetHouseId) return;

    hasSentInitialRef.current = true;
    const initialMessage = `Xin chao, toi muon lien he ve tin dang \"${targetHouseTitle || targetHouseId}\" (ID: ${targetHouseId}).`;

    api
      .post("/users/messages", {
        content: initialMessage,
        recipientId: selectedAdminId,
        houseId: targetHouseId,
        houseTitle: targetHouseTitle,
      })
      .catch((err) => {
        console.error("Failed to send initial contact message", err);
      });
  }, [user, selectedAdminId, targetHouseId, targetHouseTitle]);

  useEffect(() => {
    if (!selectedAdminId || !user) return;
    api
      .post(`/users/messages/${selectedAdminId}/seen`)
      .then(() => {
        setMessages((prev) =>
          prev.map((msg) => {
            const inThread = (msg.adminId || msg.admin?.id) === selectedAdminId;
            const fromAdmin = msg.senderRole === "ADMIN" || msg.senderRole === "SUPER_ADMIN";
            if (!inThread || !fromAdmin || msg.seen_by_role === "VIEWER") return msg;
            return { ...msg, seen_by_role: "VIEWER", seen_at: new Date().toISOString() };
          })
        );
      })
      .catch(() => {});
  }, [selectedAdminId, user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedAdminId || !user) return;

    const content = newMessage.trim();
    setNewMessage("");

    try {
      await api.post("/users/messages", {
        content,
        recipientId: selectedAdminId,
        houseId: targetHouseId,
        houseTitle: targetHouseTitle,
      });

      setMessages((prev) => [
        {
          id: `tmp-${Date.now()}`,
          content,
          senderId: user.id,
          senderRole: "VIEWER",
          created_at: new Date().toISOString(),
          adminId: selectedAdminId,
        },
        ...prev,
      ]);
    } catch (err) {
      console.error("Failed to save message", err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Please sign in</h2>
          <p className="text-gray-500 mb-6">You need an account to chat with admins.</p>
          <Link href="/login" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/profile" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="font-bold text-gray-900 leading-tight">My chat rooms</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-gray-400"}`}></span>
                <span className="text-xs text-gray-500 font-medium">{isConnected ? "Online" : "Connecting..."}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-6xl w-full mx-auto p-4 grid grid-cols-1 md:grid-cols-[280px,1fr] gap-4 pb-28">
        <div className="bg-white border border-gray-100 rounded-2xl p-3 h-[calc(100vh-220px)] overflow-y-auto">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">Conversations</p>
          {conversations.length === 0 ? (
            <p className="text-sm text-gray-500 px-1">No conversation yet.</p>
          ) : (
            <div className="space-y-2">
              {conversations.map((c) => (
                <button
                  key={c.adminId}
                  onClick={() => setSelectedAdminId(c.adminId)}
                  className={`w-full text-left rounded-xl px-3 py-2.5 border transition ${selectedAdminId === c.adminId ? "bg-blue-50 border-blue-200" : "bg-white border-gray-100 hover:bg-gray-50"}`}
                >
                  <p className="font-semibold text-sm text-gray-900 truncate">{c.adminName}</p>
                  <p className="text-xs text-gray-500 truncate mt-1">{c.latest.content}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl h-[calc(100vh-220px)] overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading messages...</div>
          ) : !selectedAdminId ? (
            <div className="text-center py-8 text-gray-500">Select a conversation.</div>
          ) : threadMessages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No messages in this room yet.</div>
          ) : (
            <div className="space-y-4">
              {threadMessages.map((msg) => {
                const isOwn = msg.senderId === user.id;
                const seenByAdmin = msg.seen_by_role === "ADMIN" || msg.seen_by_role === "SUPER_ADMIN";
                return (
                  <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] sm:max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                      <div className={`px-4 py-3 rounded-2xl ${isOwn ? "bg-blue-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-900 rounded-bl-sm"}`}>
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                      <span className="text-[11px] text-gray-400 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        {isOwn && seenByAdmin ? "  ·  Da xem" : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border-t border-gray-100 px-4 py-3 sm:py-4 fixed bottom-0 left-0 right-0 z-20 shadow-[0_-4px_20px_rgb(0,0,0,0.03)]">
        <form onSubmit={handleSend} className="max-w-6xl mx-auto flex items-end gap-2 relative">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-[24px] focus-within:bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 flex items-center p-1.5 shadow-sm transition-all">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={selectedAdminId ? "Type a message..." : "Select a conversation first"}
              disabled={!selectedAdminId}
              className="flex-1 w-full bg-transparent border-none outline-none px-4 py-2 text-[15px] text-gray-800 placeholder:text-gray-400 focus:ring-0 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!selectedAdminId || !newMessage.trim()}
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

