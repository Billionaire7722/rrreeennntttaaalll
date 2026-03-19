"use client";

export const dynamic = "force-dynamic";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, CheckCheck, ChevronLeft, MapPin, MoreVertical, Search, Send, User } from "lucide-react";
import api from "@/api/axios";
import SafeImage from "@/components/SafeImage";
import { useAuth } from "@/context/useAuth";
import { useLanguage } from "@/context/LanguageContext";
import { useSocket } from "@/contexts/SocketContext";

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

interface RecipientUser {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

interface UserPresence {
  userId: string;
  isOnline: boolean;
  lastSeenAt: string | null;
}

function sortMessages(items: Message[]) {
  return [...items].sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime());
}

function mergeMessages(current: Message[], incoming: Message[]) {
  const nextById = new Map<string, Message>();

  for (const message of current) {
    nextById.set(message.id, message);
  }

  for (const message of incoming) {
    nextById.set(message.id, message);
  }

  return sortMessages(Array.from(nextById.values()));
}

function getInitials(name: string) {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function ChatPageContent() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const { t, localeTag, formatTime, formatDate } = useLanguage();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const searchRecipientId = searchParams.get("recipientId");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(searchRecipientId);
  const [searchTerm, setSearchTerm] = useState("");
  const [recipientUser, setRecipientUser] = useState<RecipientUser | null>(null);
  const [presenceByUserId, setPresenceByUserId] = useState<Record<string, UserPresence>>({});
  const [isSending, setIsSending] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const hasSentInitialRef = useRef(false);
  const activeThreadRequestRef = useRef(0);
  const shouldAutoScrollRef = useRef(false);
  const pendingScrollBehaviorRef = useRef<ScrollBehavior>("auto");
  const targetHouseId = searchParams.get("houseId");
  const targetHouseTitle = searchParams.get("houseTitle");

  const formatChatTime = (value: string) => {
    const date = new Date(value);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diffDays === 0) return formatTime(date);
    if (diffDays < 7) return new Intl.DateTimeFormat(localeTag, { weekday: "short" }).format(date);
    return formatDate(date, { day: "2-digit", month: "2-digit" });
  };

  const formatPresenceLabel = useCallback((presence?: UserPresence | null) => {
    if (!presence) return t("chat.offline");
    if (presence.isOnline) return t("chat.online");
    if (!presence.lastSeenAt) return t("chat.offline");

    const lastSeen = new Date(presence.lastSeenAt);
    const formatted = new Intl.DateTimeFormat(localeTag, {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(lastSeen);

    return t("chat.lastSeenAt", { time: formatted });
  }, [localeTag, t]);

  const isNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    return container.scrollHeight - container.scrollTop - container.clientHeight < 120;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  }, []);

  const syncSelectedUserFromQuery = useCallback(() => {
    setSelectedUserId((current) => {
      if (searchRecipientId === current) return current;
      return searchRecipientId;
    });
  }, [searchRecipientId]);

  const fetchPresence = useCallback(async (targetUserId: string) => {
    try {
      const response = await api.get(`/presence/${targetUserId}`);
      setPresenceByUserId((previous) => ({
        ...previous,
        [targetUserId]: response.data,
      }));
    } catch (error) {
      console.error("Failed to fetch presence", error);
    }
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await api.get("/users/conversations");
      setConversations(response.data || []);
    } catch (error) {
      console.error("Failed to fetch conversations", error);
    } finally {
      setLoadingConv(false);
    }
  };

  const fetchMessages = async (otherId: string) => {
    const requestId = activeThreadRequestRef.current + 1;
    activeThreadRequestRef.current = requestId;
    setLoadingMsgs(true);
    try {
      const response = await api.get(`/users/messages/${otherId}`);
      if (activeThreadRequestRef.current !== requestId) return;

      const nextMessages = sortMessages(response.data || []);
      setMessages((previous) => {
        if (
          previous.length === nextMessages.length &&
          previous.every(
            (message, index) =>
              message.id === nextMessages[index]?.id &&
              message.seen_at === nextMessages[index]?.seen_at &&
              message.content === nextMessages[index]?.content
          )
        ) {
          return previous;
        }

        return nextMessages;
      });
      shouldAutoScrollRef.current = true;
      pendingScrollBehaviorRef.current = "auto";
      await api.post(`/users/messages/${otherId}/seen`);
      if (activeThreadRequestRef.current !== requestId) return;
      setConversations((previous) =>
        previous.map((conversation) =>
          conversation.otherUser.id === otherId ? { ...conversation, unreadCount: 0 } : conversation
        )
      );
    } catch (error) {
      console.error("Failed to fetch messages", error);
    } finally {
      if (activeThreadRequestRef.current === requestId) {
        setLoadingMsgs(false);
      }
    }
  };

  useEffect(() => {
    if (user) fetchConversations();
  }, [user]);

  useEffect(() => {
    syncSelectedUserFromQuery();
  }, [syncSelectedUserFromQuery]);

  useEffect(() => {
    if (!selectedUserId || !user) {
      activeThreadRequestRef.current += 1;
      setMessages([]);
      setRecipientUser(null);
      setLoadingMsgs(false);
      return;
    }

    setMessages([]);
    fetchMessages(selectedUserId);
  }, [selectedUserId, user]);

  useEffect(() => {
    hasSentInitialRef.current = false;
  }, [selectedUserId, targetHouseId, targetHouseTitle]);

  useEffect(() => {
    if (!selectedUserId) {
      setRecipientUser(null);
      return;
    }

    const inList = conversations.find((conversation) => conversation.otherUser.id === selectedUserId);
    if (inList) {
      setRecipientUser(null);
      return;
    }

    api
      .get(`/users/public/${selectedUserId}`)
      .then((response) => setRecipientUser(response.data))
      .catch((error) => console.error("Failed to fetch recipient info", error));
  }, [conversations, selectedUserId]);

  useEffect(() => {
    if (!selectedUserId) return;

    fetchPresence(selectedUserId);
    const interval = window.setInterval(() => {
      fetchPresence(selectedUserId);
    }, 20_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [fetchPresence, selectedUserId]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      const isCurrentThreadMessage =
        (message.senderId === selectedUserId && message.receiverId === user?.id) ||
        (message.senderId === user?.id && message.receiverId === selectedUserId);

      if (isCurrentThreadMessage) {
        const shouldStickToBottom = message.senderId === user?.id || isNearBottom();
        setMessages((previous) => mergeMessages(previous, [message]));
        shouldAutoScrollRef.current = shouldStickToBottom;
        pendingScrollBehaviorRef.current = message.senderId === user?.id ? "smooth" : "auto";

        if (message.senderId === selectedUserId) {
          api.post(`/users/messages/${selectedUserId}/seen`).catch(() => {});
        }
      }

      setConversations((previous) => {
        const otherId = message.senderId === user?.id ? message.receiverId : message.senderId;
        if (!otherId) return previous;
        const existing = previous.find((conversation) => conversation.otherUser.id === otherId);
        const isSelected = selectedUserId === otherId;

        if (existing) {
          const nextUnreadCount = !isSelected && message.senderId === otherId && existing.lastMessage.id !== message.id ? existing.unreadCount + 1 : 0;
          if (existing.lastMessage.id === message.id && existing.unreadCount === nextUnreadCount) {
            return previous;
          }

          const updated = {
            ...existing,
            lastMessage: message,
            unreadCount: nextUnreadCount,
          };
          return [updated, ...previous.filter((conversation) => conversation.otherUser.id !== otherId)];
        }

        const fallbackUser =
          message.senderId === user?.id
            ? recipientUser || { id: message.receiverId, name: t("common.guest"), avatarUrl: null }
            : message.user || { id: message.senderId, name: t("common.guest"), avatarUrl: null };

        return [
          {
            otherUser: {
              id: otherId,
              name: fallbackUser.name,
              avatarUrl: fallbackUser.avatarUrl || null,
            },
            lastMessage: message,
            unreadCount: !isSelected && message.senderId === otherId ? 1 : 0,
          },
          ...previous,
        ];
      });
    };

    const handlePresenceChanged = (presence: UserPresence) => {
      if (!presence?.userId) return;
      setPresenceByUserId((previous) => ({
        ...previous,
        [presence.userId]: presence,
      }));
    };

    const handleConversationSeen = (payload: { seenByUserId: string; messageIds: string[]; seenAt: string }) => {
      if (!payload?.seenByUserId || payload.seenByUserId !== selectedUserId) return;

      const seenIds = new Set(payload.messageIds || []);
      if (seenIds.size === 0) return;

      setMessages((previous) =>
        previous.map((message) =>
          seenIds.has(message.id)
            ? {
                ...message,
                seen_at: payload.seenAt,
              }
            : message
        )
      );
    };

    socket.on("new_message", handleNewMessage);
    socket.on("message_sent", handleNewMessage);
    socket.on("presence_changed", handlePresenceChanged);
    socket.on("conversation_seen", handleConversationSeen);
    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("message_sent", handleNewMessage);
      socket.off("presence_changed", handlePresenceChanged);
      socket.off("conversation_seen", handleConversationSeen);
    };
  }, [isNearBottom, recipientUser, selectedUserId, socket, t, user?.id]);

  useEffect(() => {
    if (!user || hasSentInitialRef.current || !selectedUserId || !targetHouseId) return;
    hasSentInitialRef.current = true;

    api
      .post("/users/messages", {
        content: t("chat.initialPropertyMessage", {
          title: targetHouseTitle || targetHouseId,
        }),
        recipientId: selectedUserId,
        houseId: targetHouseId,
        houseTitle: targetHouseTitle,
      })
      .catch((error) => console.error("Failed to send initial message", error));
  }, [selectedUserId, t, targetHouseId, targetHouseTitle, user]);

  useEffect(() => {
    if (!selectedUserId) {
      shouldAutoScrollRef.current = false;
      return;
    }

    if (!messages.length || !shouldAutoScrollRef.current) return;

    const animationFrame = window.requestAnimationFrame(() => {
      scrollToBottom(pendingScrollBehaviorRef.current);
      shouldAutoScrollRef.current = false;
      pendingScrollBehaviorRef.current = "auto";
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [messages, scrollToBottom, selectedUserId]);

  useEffect(() => {
    const composer = composerRef.current;
    if (!composer) return;
    composer.style.height = "0px";
    composer.style.height = `${Math.min(composer.scrollHeight, 160)}px`;
  }, [newMessage]);

  useEffect(() => {
    if (!selectedUserId) return;

    const frame = window.requestAnimationFrame(() => {
      composerRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedUserId]);

  const handleSend = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!newMessage.trim() || !selectedUserId || !user || isSending) return;
    const content = newMessage.trim();
    shouldAutoScrollRef.current = true;
    pendingScrollBehaviorRef.current = "smooth";
    setIsSending(true);
    try {
      await api.post("/users/messages", { content, recipientId: selectedUserId });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message", error);
      setNewMessage((previous) => previous || content);
    } finally {
      setIsSending(false);
    }
  };

  const handleComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void handleSend();
    }
  };

  const filteredConversations = useMemo(
    () => conversations.filter((conversation) => conversation.otherUser.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [conversations, searchTerm]
  );

  const selectedConversation = conversations.find((conversation) => conversation.otherUser.id === selectedUserId);
  const displayUser =
    selectedConversation?.otherUser ||
    (recipientUser ? { id: recipientUser.id, name: recipientUser.name, avatarUrl: recipientUser.avatarUrl } : null);
  const selectedPresence = selectedUserId ? presenceByUserId[selectedUserId] : null;

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <User className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <h2 className="mb-2 text-xl font-bold text-gray-900">{t("chat.signInRequiredTitle")}</h2>
          <p className="mb-6 text-gray-500">{t("chat.signInRequiredDescription")}</p>
          <Link href="/login" className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700">
            {t("auth.shared.signInLink")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] overflow-hidden bg-white">
      <div className={`w-full flex-shrink-0 border-r border-gray-100 md:w-[360px] ${selectedUserId ? "hidden md:flex" : "flex"} flex-col`}>
        <div className="sticky top-0 z-10 border-b border-gray-50 bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/profile" className="rounded-full p-2 transition-colors hover:bg-gray-100">
                <ChevronLeft className="h-6 w-6 text-gray-700" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{t("chat.conversationsTitle")}</h1>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-gray-300"}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{isConnected ? t("chat.online") : t("chat.offline")}</span>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t("common.search")}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-full border-none bg-gray-100 py-2 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="hide-scrollbar flex-1 overflow-y-auto pb-20">
          {loadingConv ? <div className="p-4 text-sm text-gray-400">{t("common.loading")}</div> : null}
          {!loadingConv && filteredConversations.length === 0 ? <div className="p-8 text-center text-sm text-gray-400">{t("chat.emptyTitle")}</div> : null}
          {!loadingConv && filteredConversations.map((conversation) => {
            const isUnread = conversation.unreadCount > 0;
            return (
              <button
                key={conversation.otherUser.id}
                onClick={() => setSelectedUserId(conversation.otherUser.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${selectedUserId === conversation.otherUser.id ? "bg-blue-50/50" : ""}`}
              >
                {conversation.otherUser.avatarUrl ? (
                  <SafeImage src={conversation.otherUser.avatarUrl} alt={conversation.otherUser.name} className="h-14 w-14 rounded-full object-cover" fallbackSrc="/images/defaultimage.jpg" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">{getInitials(conversation.otherUser.name)}</div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-baseline justify-between">
                    <h3 className={`truncate text-[15px] font-semibold ${isUnread ? "text-gray-900" : "text-gray-700"}`}>{conversation.otherUser.name}</h3>
                    <span className="text-[11px] font-medium text-gray-400">{formatChatTime(conversation.lastMessage.created_at)}</span>
                  </div>
                  <p className={`truncate text-sm ${isUnread ? "font-bold text-gray-900" : "text-gray-500"}`}>
                    {conversation.lastMessage.senderId === user.id ? t("chat.youPrefix") : ""}
                    {conversation.lastMessage.content}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`min-h-0 min-w-0 flex-1 flex-col bg-white ${!selectedUserId ? "hidden md:flex" : "flex"}`}>
        {selectedUserId && displayUser ? (
          <>
            <div className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-gray-100 bg-white/80 px-3 backdrop-blur-md sm:px-6">
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                <button onClick={() => setSelectedUserId(null)} className="rounded-full p-2 transition-colors hover:bg-gray-100 md:hidden">
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <Link href={`/user/${displayUser.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  {displayUser.avatarUrl ? (
                    <SafeImage src={displayUser.avatarUrl} alt={displayUser.name} className="h-10 w-10 rounded-full object-cover" fallbackSrc="/images/defaultimage.jpg" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">{getInitials(displayUser.name)}</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-bold text-gray-900">{displayUser.name}</h2>
                    <p className={`flex items-center gap-1 text-[11px] font-semibold ${selectedPresence?.isOnline ? "text-green-500" : "text-gray-400"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${selectedPresence?.isOnline ? "bg-green-500" : "bg-gray-300"}`} />
                      <span className="truncate">{formatPresenceLabel(selectedPresence)}</span>
                    </p>
                  </div>
                </Link>
              </div>

              <div className="ml-3 flex flex-shrink-0 items-center gap-2 sm:gap-3">
                {targetHouseId ? (
                  <Link href={`/properties/${targetHouseId}`} className="hidden items-center gap-2 rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 sm:flex">
                    <MapPin className="h-3 w-3 text-red-500" />
                    {targetHouseTitle || t("chat.viewProperty")}
                  </Link>
                ) : null}
                <button className="hidden rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 sm:flex">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div ref={messagesContainerRef} className="hide-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto bg-gray-50/30 p-4 sm:p-6">
              {loadingMsgs ? <div className="text-center text-sm text-gray-400">{t("chat.loadingMessages")}</div> : null}
              {!loadingMsgs && messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                    <User className="h-10 w-10 text-blue-200" />
                  </div>
                  <h3 className="mb-1 font-bold text-gray-800">{t("chat.startTitle")}</h3>
                  <p className="max-w-[200px] text-sm text-gray-400">{t("chat.startDescription")}</p>
                </div>
              ) : null}

              {!loadingMsgs && messages.length > 0 ? (
                <div className="space-y-6">
                  {messages.map((message, index) => {
                    const isOwn = message.senderId === user.id;
                    const nextMessage = messages[index + 1];
                    const isLastInGroup = !nextMessage || nextMessage.senderId !== message.senderId;
                    const showTime = !nextMessage || new Date(nextMessage.created_at).getTime() - new Date(message.created_at).getTime() > 30 * 60 * 1000;
                    return (
                      <div key={message.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                        <div className="flex max-w-[85%] items-end gap-2 sm:max-w-[70%]">
                          {!isOwn && isLastInGroup ? (
                            displayUser.avatarUrl ? (
                              <SafeImage src={displayUser.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" fallbackSrc="/images/defaultimage.jpg" />
                            ) : (
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">{getInitials(displayUser.name)}</div>
                            )
                          ) : (
                            <div className="w-7" />
                          )}
                          <div className={`rounded-[20px] px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${isOwn ? "rounded-br-none bg-blue-600 text-white" : "rounded-bl-none border border-gray-100 bg-white text-gray-800"}`}>
                            {message.content}
                          </div>
                        </div>
                        <div className={`mt-1 flex flex-col px-1 ${isOwn ? "items-end" : "items-start"}`}>
                          {showTime ? <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{formatTime(new Date(message.created_at))}</span> : null}
                          {isOwn && index === messages.length - 1 ? (
                            <div className="mt-0.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-tighter text-gray-400">
                              {message.seen_at ? <CheckCheck size={12} className="text-blue-500" /> : <Check size={12} />}
                              {message.seen_at ? t("chat.seen") : t("chat.sent")}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="sticky bottom-0 z-10 border-t border-gray-100 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-6">
              <form onSubmit={handleSend} className="mx-auto flex max-w-4xl items-end gap-3 rounded-[28px] bg-gray-50 p-1.5 ring-1 ring-gray-100 transition-all focus-within:ring-2 focus-within:ring-blue-100">
                <textarea
                  ref={composerRef}
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  placeholder={t("chat.typeMessagePlaceholder")}
                  rows={1}
                  autoComplete="off"
                  className="max-h-40 flex-1 resize-none border-none bg-transparent px-4 py-2.5 text-[15px] text-gray-800 outline-none placeholder:text-gray-400 focus:ring-0"
                />
                <button type="submit" disabled={!newMessage.trim() || isSending} className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white transition-all duration-200 hover:bg-blue-700 disabled:opacity-30">
                  <Send className="ml-0.5 h-5 w-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center bg-gray-50/20 p-8 text-center">
            <div className="mb-6 flex h-24 w-24 rotate-3 items-center justify-center rounded-3xl bg-white shadow-sm">
              <User className="h-12 w-12 text-blue-100" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-gray-900">{t("chat.selectConversationTitle")}</h2>
            <p className="max-w-xs text-sm text-gray-400">{t("chat.selectConversationDescription")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-white"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>}>
      <ChatPageContent />
    </Suspense>
  );
}
