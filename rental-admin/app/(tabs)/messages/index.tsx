import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL } from "@/constants/api";

type ViewerUser = {
  id: string;
  name: string;
  username?: string;
  email?: string;
};

type AdminMessage = {
  id: string;
  userId: string;
  senderId?: string;
  senderRole: string;
  content: string;
  created_at: string;
  user?: ViewerUser;
};

type AdminMessageResponse = {
  items: AdminMessage[];
  skip: number;
  take: number;
};

export default function MessagesScreen() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [selectedViewerId, setSelectedViewerId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const fetchMessages = async (silent = false) => {
    if (!token) return;

    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);

    try {
      const res = await fetch(`${API_BASE_URL}/users/admin/messages?skip=0&take=200`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to load messages");

      const data = (await res.json()) as AdminMessageResponse;
      const items = Array.isArray(data?.items) ? data.items : [];
      setMessages(items);

      if (!selectedViewerId && items.length > 0) {
        setSelectedViewerId(items[0].userId);
      }
    } catch (err) {
      console.error("Failed to fetch admin messages", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [token]);

  useEffect(() => {
    const timer = setInterval(() => {
      fetchMessages(true);
    }, 5000);
    return () => clearInterval(timer);
  }, [token, selectedViewerId]);

  const threads = useMemo(() => {
    const map = new Map<string, { viewer: ViewerUser; latest: AdminMessage; unread: number }>();

    for (const msg of messages) {
      const viewer = msg.user || { id: msg.userId, name: msg.userId };
      const existing = map.get(msg.userId);
      const currentTime = new Date(msg.created_at).getTime();
      const existingTime = existing ? new Date(existing.latest.created_at).getTime() : 0;
      const isUnread = msg.senderRole === "VIEWER";

      if (!existing || currentTime > existingTime) {
        map.set(msg.userId, {
          viewer,
          latest: msg,
          unread: (existing?.unread || 0) + (isUnread ? 1 : 0),
        });
      } else if (isUnread) {
        existing.unread += 1;
        map.set(msg.userId, existing);
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime()
    );
  }, [messages]);

  const currentThread = useMemo(() => {
    if (!selectedViewerId) return [];

    return messages
      .filter((msg) => msg.userId === selectedViewerId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [messages, selectedViewerId]);

  const sendReply = async () => {
    if (!token || !selectedViewerId || !replyText.trim() || sending) return;

    setSending(true);
    try {
      const content = replyText.trim();
      const res = await fetch(`${API_BASE_URL}/users/admin/messages/${selectedViewerId}/reply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error("Failed to send reply");

      setReplyText("");
      await fetchMessages(true);
    } catch (err) {
      console.error("Failed to send admin reply", err);
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.mutedText}>Ban can dang nhap de xem tin nhan.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.leftPanel}>
        <Text style={styles.panelTitle}>Hoi thoai</Text>
        <FlatList
          data={threads}
          keyExtractor={(item) => item.viewer.id}
          refreshing={refreshing}
          onRefresh={() => fetchMessages(true)}
          renderItem={({ item }) => {
            const active = item.viewer.id === selectedViewerId;
            return (
              <Pressable
                style={[styles.threadItem, active && styles.threadItemActive]}
                onPress={() => setSelectedViewerId(item.viewer.id)}
              >
                <View style={styles.threadHeader}>
                  <Text style={styles.threadName} numberOfLines={1}>
                    {item.viewer.name || item.viewer.username || item.viewer.id}
                  </Text>
                  {item.unread > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.unread}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.threadSnippet} numberOfLines={1}>
                  {item.latest.content}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <View style={styles.rightPanel}>
        {selectedViewerId ? (
          <>
            <Text style={styles.panelTitle}>Tin nhan chi tiet</Text>
            <FlatList
              data={currentThread}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 8 }}
              renderItem={({ item }) => {
                const mine = item.senderRole === "ADMIN" || item.senderRole === "SUPER_ADMIN";
                return (
                  <View style={[styles.messageRow, mine ? styles.messageRowMine : styles.messageRowTheirs]}>
                    <View style={[styles.messageBubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                      <Text style={[styles.messageText, mine && { color: Colors.white }]}>{item.content}</Text>
                    </View>
                  </View>
                );
              }}
            />

            <View style={styles.replyBox}>
              <TextInput
                value={replyText}
                onChangeText={setReplyText}
                placeholder="Nhap phan hoi..."
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.input}
                multiline
              />
              <Pressable
                style={[styles.sendButton, (!replyText.trim() || sending) && styles.sendButtonDisabled]}
                onPress={sendReply}
                disabled={!replyText.trim() || sending}
              >
                <Text style={styles.sendButtonText}>{sending ? "Dang gui..." : "Gui"}</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.center}>
            <Text style={styles.mutedText}>Chua co hoi thoai nao.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    flexDirection: Platform.OS === "web" ? "row" : "column",
  },
  leftPanel: {
    width: Platform.OS === "web" ? 320 : "100%",
    borderRightWidth: Platform.OS === "web" ? 1 : 0,
    borderBottomWidth: Platform.OS === "web" ? 0 : 1,
    borderBottomColor: Colors.border,
    borderRightColor: Colors.border,
    backgroundColor: Colors.white,
    padding: 12,
    maxHeight: Platform.OS === "web" ? undefined : 260,
  },
  rightPanel: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 12,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 12,
  },
  threadItem: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: Colors.white,
  },
  threadItemActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "10",
  },
  threadHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  threadName: {
    flex: 1,
    marginRight: 8,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.text,
  },
  threadSnippet: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  badge: {
    minWidth: 20,
    paddingHorizontal: 6,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
  messageRow: {
    marginBottom: 8,
    flexDirection: "row",
  },
  messageRowMine: {
    justifyContent: "flex-end",
  },
  messageRowTheirs: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  bubbleMine: {
    backgroundColor: Colors.primary,
  },
  bubbleTheirs: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    color: Colors.light.text,
    fontSize: 13,
  },
  replyBox: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.light.text,
    minHeight: 42,
    maxHeight: 90,
    backgroundColor: Colors.white,
  },
  sendButton: {
    marginTop: 8,
    alignSelf: "flex-end",
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  sendButtonDisabled: {
    opacity: 0.55,
  },
  sendButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 13,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mutedText: {
    color: Colors.light.textSecondary,
    fontSize: 14,
  },
});
