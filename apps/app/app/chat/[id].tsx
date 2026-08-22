import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Lock, Send, ShieldAlert, ShieldCheck } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows, Typography } from '../../src/components/Theme';
import { useAuthStore } from '../../src/store/auth.store';
import { useChatStore } from '../../src/store/chat.store';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const {
    messages,
    sendMessage,
    joinConversation,
    leaveConversation,
    fetchMessages,
    sendTyping,
    typingUsers,
    connect,
  } = useChatStore();

  const [inputMessage, setInputMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    connect();
    if (conversationId) {
      joinConversation(conversationId);
      fetchMessages(conversationId);
    }

    return () => {
      if (conversationId) {
        leaveConversation(conversationId);
      }
    };
  }, [conversationId]);

  const conversationMessages =
    (conversationId && messages[conversationId]) || [];

  const handleSend = () => {
    const trimmed = inputMessage.trim();
    if (!trimmed || !user || !conversationId) return;

    sendMessage(user.id, conversationId, trimmed);
    setInputMessage('');
  };

  const handleInputChange = (text: string) => {
    setInputMessage(text);
    if (user && conversationId) {
      sendTyping(conversationId, user.id, text.length > 0);
    }
  };

  const onRefresh = async () => {
    if (conversationId) {
      setIsRefreshing(true);
      await fetchMessages(conversationId);
      setIsRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top + 8, 16),
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <ArrowLeft size={18} color="#111813" />
        </TouchableOpacity>

        <View style={styles.topHeaderInfo}>
          <Text style={styles.topHeaderTitle}>Chat & Coordinación</Text>
          <View style={styles.escrowStatusPill}>
            <Lock size={10} color="#059669" />
            <Text style={styles.escrowStatusText}>Protegido con Escrow</Text>
          </View>
        </View>

        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {/* Banner de Seguridad Anti-Fraude */}
        <View style={styles.securityBanner}>
          <ShieldAlert size={16} color="#D97706" />
          <Text style={styles.securityText}>
            Tus pagos y fondos están 100% protegidos por el sistema Escrow de Yewi.
          </Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={conversationMessages}
          keyExtractor={(item, index) => item.id || `msg_${index}`}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          renderItem={({ item }) => {
            const isMine = item.senderId === user?.id;
            return (
              <View
                style={[
                  styles.messageBubble,
                  isMine ? styles.myMessage : styles.theirMessage,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isMine ? styles.myMessageText : styles.theirMessageText,
                  ]}
                >
                  {item.content}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    isMine ? styles.myMessageTime : styles.theirMessageTime,
                  ]}
                >
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Ahora'}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <ShieldCheck size={28} color="#059669" />
              </View>
              <Text style={styles.emptyTitle}>Conversación Segura</Text>
              <Text style={styles.emptyText}>
                Escribe un mensaje para coordinar la visita, detalles del trabajo o entrega de fotos.
              </Text>
            </View>
          }
        />

        {conversationId && typingUsers[conversationId] && (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>El profesional está escribiendo...</Text>
          </View>
        )}

        {/* Input Bar anclado con SafeAreaInsets */}
        <View
          style={[
            styles.inputBar,
            {
              paddingBottom: Math.max(insets.bottom + 8, 14),
            },
          ]}
        >
          <TextInput
            style={styles.textInput}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#8E9892"
            value={inputMessage}
            onChangeText={handleInputChange}
            onSubmitEditing={handleSend}
            multiline={false}
            returnKeyType="send"
          />

          <TouchableOpacity
            style={[
              styles.sendBtn,
              inputMessage.trim().length > 0 && styles.sendBtnActive,
            ]}
            onPress={handleSend}
            disabled={!inputMessage.trim()}
            activeOpacity={0.85}
          >
            <Send size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E2D5',
    ...Shadows.subtle,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E8E2D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeaderInfo: {
    alignItems: 'center',
  },
  topHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111813',
  },
  escrowStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 4,
    marginTop: 2,
  },
  escrowStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  keyboardContainer: {
    flex: 1,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 119, 6, 0.15)',
    gap: 8,
  },
  securityText: {
    fontSize: 11,
    color: '#B45309',
    flex: 1,
    lineHeight: 15,
    fontWeight: '600',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
    ...Shadows.subtle,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#111813',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E8E2D5',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  theirMessageText: {
    color: '#111813',
    fontWeight: '500',
  },
  messageTime: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  theirMessageTime: {
    color: '#8E9892',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111813',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#6C756F',
    textAlign: 'center',
    lineHeight: 18,
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  typingText: {
    fontSize: 11,
    color: '#6C756F',
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E2D5',
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 8,
    ...Shadows.subtle,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E8E2D5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#111813',
    fontSize: 14,
    fontWeight: '600',
    height: 46,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8E2D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: '#111813',
  },
});
