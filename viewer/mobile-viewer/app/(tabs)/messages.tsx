import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import Colors from '@shared/constants/colors';

type ViewerMessage = {
  id: string;
  content: string;
  senderId: string;
  senderRole: string;
  created_at: string;
};

export default function MessagesScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<ViewerMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/users/messages');
      const items = Array.isArray(res.data) ? res.data : [];
      setMessages(items);
    } catch (err) {
      console.error('Failed to fetch viewer messages', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!user || !token) {
      setLoading(false);
      return;
    }
    fetchMessages();
  }, [user, token, fetchMessages]);

  useEffect(() => {
    if (!user || !token) return;
    const timer = setInterval(() => fetchMessages(true), 5000);
    return () => clearInterval(timer);
  }, [user, token, fetchMessages]);

  const orderedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    [messages]
  );

  const sendMessage = async () => {
    const content = draft.trim();
    if (!content || !token || sending) return;

    setSending(true);
    try {
      await api.post('/users/messages', { content });
      setDraft('');
      await fetchMessages(true);
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Login Required</Text>
        <Text style={styles.subtitle}>Please login to view and send messages.</Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.push('/login')}>
          <Text style={styles.primaryBtnText}>Sign In</Text>
        </Pressable>
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>Chat with admin support</Text>
      </View>

      <FlatList
        data={orderedMessages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const fromAdmin = item.senderRole === 'ADMIN' || item.senderRole === 'SUPER_ADMIN';
          return (
            <View style={[styles.row, fromAdmin ? styles.rowLeft : styles.rowRight]}>
              <View style={[styles.bubble, fromAdmin ? styles.adminBubble : styles.viewerBubble]}>
                <Text style={[styles.bubbleText, !fromAdmin && styles.viewerBubbleText]}>
                  {item.content}
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>Send your first message to contact admin.</Text>
          </View>
        }
      />

      <View style={styles.composeBox}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Type a message..."
          placeholderTextColor={Colors.light.textSecondary}
          style={styles.input}
          multiline
        />
        <Pressable
          style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!draft.trim() || sending}
        >
          <Text style={styles.sendBtnText}>{sending ? 'Sending...' : 'Send'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: Colors.white,
    fontWeight: '700',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: 20,
  },
  row: {
    marginBottom: 8,
    flexDirection: 'row',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  adminBubble: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  viewerBubble: {
    backgroundColor: Colors.primary,
  },
  bubbleText: {
    color: Colors.light.text,
    fontSize: 14,
    lineHeight: 20,
  },
  viewerBubbleText: {
    color: Colors.white,
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  composeBox: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    gap: 8,
  },
  input: {
    minHeight: 42,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
    textAlignVertical: 'top',
  },
  sendBtn: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
});

