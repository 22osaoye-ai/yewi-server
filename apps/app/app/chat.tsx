import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { io, Socket } from 'socket.io-client';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuthStore } from '@/store/useAuthStore';
import {
  chatApi,
  ChatMessage,
  ConversationDetail,
  ConversationItem,
  ContactItem,
  ChatParticipant,
} from '@/services/chatApi';
import { statusesApi, AuthorStatusFeedGroup } from '@/services/statusesApi';
import { streamChatService } from '@/services/streamChatService';
import { StreamChatView, isStreamNativeSupported } from '@/components/chat/StreamChatView';
import { getRealtimeUrl, realtimeService } from '@/services/realtimeService';
import { getAccessToken } from '@/services/apiClient';
import { toast } from '@/store/useToastStore';
import { useSeenStatusesStore } from '@/store/useSeenStatusesStore';
import { StatusViewerModal } from '@/components/chat/StatusViewerModal';
import { CreateStatusModal } from '@/components/chat/CreateStatusModal';
import { ChannelHeader } from '@/components/chat/ChannelHeader';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageInputComposer } from '@/components/chat/MessageInputComposer';
import { MessageReactionsBar } from '@/components/chat/MessageReactionsBar';
import { ImageViewerModal } from '@/components/chat/ImageViewerModal';
import { AttachmentMeta } from '@/services/chatApi';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';


type ChatTab = 'CHATS' | 'ESTADOS' | 'CONTACTOS';

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();
  const isGroupSeen = useSeenStatusesStore((state) => state.isGroupSeen);
  const params = useLocalSearchParams<{
    id?: string;
    conversationId?: string;
    orderId?: string;
    requestId?: string;
    targetName?: string;
    targetUserId?: string;
    initialMessage?: string;
  }>();

  // Navigation state between Hub and 1-on-1 Conversation
  const [activeTargetId, setActiveTargetId] = useState<string | null>(
    params.conversationId ||
      params.id ||
      params.targetUserId ||
      params.orderId ||
      params.requestId ||
      null,
  );

  const [activeTab, setActiveTab] = useState<ChatTab>('CHATS');

  // Hub data state
  const [conversationsList, setConversationsList] = useState<ConversationItem[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);

  const [storiesFeed, setStoriesFeed] = useState<AuthorStatusFeedGroup[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [selectedStoryGroup, setSelectedStoryGroup] = useState<AuthorStatusFeedGroup | null>(null);
  const [isCreateStatusOpen, setIsCreateStatusOpen] = useState(false);

  const [contactsList, setContactsList] = useState<ContactItem[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');

  // 1-on-1 Conversation state
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState(params.initialMessage || '');
  const [isLoadingConv, setIsLoadingConv] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorConv, setErrorConv] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  const [pendingAttachment, setPendingAttachment] = useState<
    (AttachmentMeta & { localUri?: string; base64?: string }) | null
  >(null);
  const [selectedMessageForReactions, setSelectedMessageForReactions] =
    useState<ChatMessage | null>(null);
  const [activeImageViewer, setActiveImageViewer] = useState<{
    url: string;
    caption?: string | null;
  } | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stream Chat client & active channel state
  const [streamClient, setStreamClient] = useState<any>(null);
  const [streamChannel, setStreamChannel] = useState<any>(null);

  useEffect(() => {
    if (!isStreamNativeSupported) return;
    let mounted = true;
    (async () => {
      const client = await streamChatService.getConnectedClient();
      if (mounted && client) {
        setStreamClient(client);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!isStreamNativeSupported || !streamClient || !conversation || !user?.id) return;
    let mounted = true;
    const otherId = conversation.otherParticipant?.id;
    if (!otherId) return;

    (async () => {
      try {
        const channel = await streamChatService.getOrCreateDirectChannel(
          user.id,
          otherId,
          {
            conversationId: conversation.conversationId,
            orderId: conversation.orderId || undefined,
            requestId: conversation.serviceRequestId || undefined,
          },
        );
        if (mounted && channel) {
          setStreamChannel(channel);
        }
      } catch {}
    })();

    return () => {
      mounted = false;
    };
  }, [streamClient, conversation, user?.id]);

  const isTypingEmittedRef = useRef<boolean>(false);

  // Sync params if they change dynamically
  useEffect(() => {
    const newTarget =
      params.conversationId ||
      params.id ||
      params.targetUserId ||
      params.orderId ||
      params.requestId;
    if (newTarget) {
      setActiveTargetId(newTarget);
    }
  }, [params.conversationId, params.id, params.targetUserId, params.orderId, params.requestId]);

  // Load Hub data
  const loadConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const data = await chatApi.getMyConversations();
      setConversationsList(Array.isArray(data) ? data : []);
    } catch {
      setConversationsList([]);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const loadStories = useCallback(async () => {
    try {
      setLoadingStories(true);
      const feed = await statusesApi.getFeed();
      setStoriesFeed(Array.isArray(feed) ? feed : []);
    } catch {
      setStoriesFeed([]);
    } finally {
      setLoadingStories(false);
    }
  }, []);

  const loadContacts = useCallback(async () => {
    try {
      setLoadingContacts(true);
      const contacts = await chatApi.getContacts();
      setContactsList(Array.isArray(contacts) ? contacts : []);
    } catch {
      setContactsList([]);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  useEffect(() => {
    if (!activeTargetId) {
      loadConversations();
      loadStories();
      loadContacts();
    }
  }, [activeTargetId, loadConversations, loadStories, loadContacts]);

  // Realtime updates for statuses and chat across all devices
  useEffect(() => {
    const unsubStatusNew = realtimeService.on('status:new', (data) => {
      if (data?.authorGroup) {
        setStoriesFeed((prev) => {
          const filtered = prev.filter((g) => g.authorId !== data.authorGroup.authorId);
          return [data.authorGroup, ...filtered];
        });
      } else {
        loadStories();
      }
    });

    const unsubComment = realtimeService.on('status:comment:new', () => {
      loadStories();
      loadConversations();
    });

    const unsubReaction = realtimeService.on('status:reaction:update', () => {
      loadStories();
    });

    const unsubView = realtimeService.on('status:view:update', (data) => {
      if (data?.statusId) {
        setStoriesFeed((prev) =>
          prev.map((group) => ({
            ...group,
            statuses: group.statuses.map((st) =>
              st.id === data.statusId ? { ...st, viewCount: data.viewCount } : st
            ),
          }))
        );
        setSelectedStoryGroup((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            statuses: prev.statuses.map((st) =>
              st.id === data.statusId ? { ...st, viewCount: data.viewCount } : st
            ),
          };
        });
      }
    });

    const unsubChatUpdate = realtimeService.on('chat:conversation:update', () => {
      loadConversations();
    });

    const unsubChatNew = realtimeService.on('chat:message:new', (data) => {
      loadConversations();
      if (data?.conversationId && data?.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    });

    const unsubNotif = realtimeService.on('notification:new', () => {
      loadConversations();
    });

    return () => {
      unsubStatusNew();
      unsubComment();
      unsubReaction();
      unsubView();
      unsubChatUpdate();
      unsubChatNew();
      unsubNotif();
    };
  }, [loadStories, loadConversations]);

  // Connect Stream Chat background sync on mount
  useEffect(() => {
    if (isStreamNativeSupported && user?.id) {
      streamChatService.getConnectedClient().catch(() => {});
    }
    return () => {
      // Keep alive during app session
    };
  }, [user?.id]);

  // Load 1-on-1 Conversation
  const loadConversationDetail = useCallback(async () => {
    if (!activeTargetId) return;

    try {
      setIsLoadingConv(true);
      setErrorConv(null);
      const data = await chatApi.getMessages(activeTargetId);
      setConversation(data);
      setMessages(data.messages || []);
    } catch (err: any) {
      setErrorConv(err.message || 'No se pudo cargar la conversación.');
    } finally {
      setIsLoadingConv(false);
    }
  }, [activeTargetId]);

  useEffect(() => {
    if (activeTargetId) {
      loadConversationDetail();
    }
  }, [activeTargetId, loadConversationDetail]);

  // WebSocket for Realtime chat updates in active conversation
  useEffect(() => {
    const activeConvId = conversation?.conversationId;
    if (!activeConvId) return;

    const unsubMsg = realtimeService.on('chat:message:new', (data) => {
      if (data?.conversationId === activeConvId && data?.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 80);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    });

    const unsubReaction = realtimeService.on('chat:message:reaction', (data) => {
      if (data?.conversationId === activeConvId && data?.messageId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.messageId
              ? {
                  ...m,
                  metadata: {
                    ...m.metadata,
                    reactions: data.reactions,
                  },
                }
              : m,
          ),
        );
      }
    });

    const unsubTyping = realtimeService.on('user_typing', (data) => {
      if (data?.conversationId === activeConvId && data?.userId !== user?.id) {
        setIsOtherTyping(Boolean(data.isTyping));
      }
    });

    return () => {
      unsubMsg();
      unsubReaction();
      unsubTyping();
    };
  }, [conversation?.conversationId, user?.id]);

  // Typing emitter helper
  const handleInputChange = (text: string) => {
    setInputText(text);

    const convId = conversation?.conversationId;
    const socket = socketRef.current;
    if (!socket || !convId) return;

    if (!isTypingEmittedRef.current && text.length > 0) {
      isTypingEmittedRef.current = true;
      socket.emit('typing', { conversationId: convId, isTyping: true });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingEmittedRef.current = false;
      socket.emit('typing', { conversationId: convId, isTyping: false });
    }, 2000);
  };

  // Toggle emoji reaction
  const handleToggleReaction = async (targetMessage: ChatMessage, emoji: string) => {
    if (!user?.id) return;
    const currentReactions = targetMessage.metadata?.reactions || [];
    const hasReacted = currentReactions.some((r) => r.userId === user.id && r.emoji === emoji);

    let newReactions: any[];
    if (hasReacted) {
      newReactions = currentReactions.filter((r) => !(r.userId === user.id && r.emoji === emoji));
    } else {
      const otherReactions = currentReactions.filter((r) => r.userId !== user.id);
      const userName = user.email?.split('@')[0] || 'Tú';
      newReactions = [...otherReactions, { emoji, userId: user.id, userName }];
    }

    // Optimistic UI update
    setMessages((prev) =>
      prev.map((m) =>
        m.id === targetMessage.id
          ? {
              ...m,
              metadata: {
                ...m.metadata,
                reactions: newReactions,
              },
            }
          : m,
      ),
    );

    try {
      const res = await chatApi.toggleReaction(targetMessage.id, emoji);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === targetMessage.id
            ? {
                ...m,
                metadata: {
                  ...m.metadata,
                  reactions: res.reactions,
                },
              }
            : m,
        ),
      );
    } catch {
      // Revert if error
      setMessages((prev) =>
        prev.map((m) => (m.id === targetMessage.id ? targetMessage : m)),
      );
    }
  };

  // Send message (text, documents, photos, quick actions)
  const handleSendMessage = async () => {
    const text = inputText.trim();
    if ((!text && !pendingAttachment) || !conversation || isSending) return;

    const convId = conversation.conversationId;
    const currentAtt = pendingAttachment;

    setInputText('');
    setPendingAttachment(null);

    if (socketRef.current && isTypingEmittedRef.current) {
      isTypingEmittedRef.current = false;
      socketRef.current.emit('typing', { conversationId: convId, isTyping: false });
    }

    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      conversationId: convId,
      senderId: user?.id || '',
      type: currentAtt ? 'ATTACHMENT' : 'TEXT',
      content: text,
      attachments: currentAtt ? [currentAtt.url] : [],
      metadata: currentAtt ? { attachmentsMeta: [currentAtt] } : {},
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: user?.id || '',
        profile: {
          displayName: user?.email?.split('@')[0] || 'Tú',
          avatarUrl: user?.avatarUrl,
        },
      },
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      setIsSending(true);

      let finalAttachments: string[] = [];
      let finalMeta: Record<string, any> = {};

      if (currentAtt) {
        if (currentAtt.base64 && currentAtt.base64.startsWith('data:')) {
          const uploadRes = await chatApi.uploadAttachment({
            file: currentAtt.base64,
            fileName: currentAtt.name,
            mimeType: currentAtt.mimeType,
            size: currentAtt.size,
          });
          finalAttachments = [uploadRes.url];
          finalMeta.attachmentsMeta = [uploadRes];
        } else {
          finalAttachments = [currentAtt.url];
          finalMeta.attachmentsMeta = [currentAtt];
        }
      }

      const sent = await chatApi.sendMessage({
        conversationId: convId,
        content: text,
        type: currentAtt ? 'ATTACHMENT' : 'TEXT',
        attachments: finalAttachments,
        metadata: finalMeta,
      });

      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? sent : m)),
      );
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      toast.error('Error', err.message || 'No se pudo enviar el mensaje.');
    } finally {
      setIsSending(false);
    }
  };

  const handleStartChatWithContact = (contact: ContactItem) => {
    setActiveTargetId(contact.conversationId || contact.id);
  };


  // Filtered contacts
  const filteredContacts = contactsList.filter((c) => {
    if (!contactSearchQuery.trim()) return true;
    const query = contactSearchQuery.toLowerCase();
    return (
      c.displayName?.toLowerCase().includes(query) ||
      c.businessName?.toLowerCase().includes(query) ||
      c.category?.toLowerCase().includes(query) ||
      c.city?.toLowerCase().includes(query)
    );
  });

  const otherParticipant: ChatParticipant | undefined = conversation?.otherParticipant;
  const isOtherPro = Boolean(
    otherParticipant?.isPro || otherParticipant?.professionalProfile?.id,
  );

  // ==========================================
  // VIEW: 1-ON-1 CONVERSATION
  // ==========================================
  if (activeTargetId) {
    const streamTheme = {
      colors: {
        black: isDark ? '#0A0D14' : '#0F172A',
        white: isDark ? '#161922' : '#FFFFFF',
        accent_blue: colors.primary,
        primary: colors.primary,
        grey: isDark ? '#1C202C' : '#F1F5F9',
        grey_gainsboro: isDark ? '#232838' : '#E2E8F0',
        grey_whisper: isDark ? '#141720' : '#FAFAFA',
        border: isDark ? '#2D3548' : '#E2E8F0',
        text: isDark ? '#F8FAFC' : '#0F172A',
        text_low_emphasis: isDark ? '#94A3B8' : '#64748B',
      },
    };

    if (isStreamNativeSupported && streamClient && streamChannel) {
      return (
        <StreamChatView
          client={streamClient}
          channel={streamChannel}
          theme={streamTheme}
        >
          <View
            style={[
              styles.convContainer,
              { paddingTop: Math.max(insets.top, 16), backgroundColor: colors.background },
            ]}
          >
            {/* Conversation Top Header */}
            <View
              style={[
                styles.convHeader,
                {
                  backgroundColor: isDark ? '#161922' : '#FFFFFF',
                  borderBottomColor: colors.borderSubtle,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <ThemedTouchable
                  onPress={() => setActiveTargetId(null)}
                  haptic="light"
                  style={styles.backBtn}
                >
                  <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </ThemedTouchable>

                <ThemedTouchable
                  onPress={() => setShowProfileModal(true)}
                  haptic="light"
                  style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}
                >
                  <View style={styles.convAvatarWrap}>
                    {otherParticipant?.avatarUrl ? (
                      <Image
                        source={{ uri: otherParticipant.avatarUrl }}
                        style={styles.convAvatar}
                        contentFit="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.convAvatarPlaceholder,
                          { backgroundColor: colors.primaryLight },
                        ]}
                      >
                        <Text style={[styles.convAvatarInitial, { color: colors.primary }]}>
                          {(otherParticipant?.displayName || params.targetName || 'U')
                            .charAt(0)
                            .toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.chatOnlineDot} />
                    {isOtherPro && (
                      <View style={styles.convProBadge}>
                        <Ionicons name="checkmark" size={8} color="#FFFFFF" />
                      </View>
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={[styles.convNameText, { color: colors.textPrimary }]}
                    >
                      {otherParticipant?.displayName || params.targetName || 'Chat Yewi'}
                    </Text>
                    <Text
                      style={[
                        styles.convStatusText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {isOtherPro ? 'Profesional Verificado' : 'En línea'}
                    </Text>
                  </View>
                </ThemedTouchable>
              </View>

              <ThemedTouchable
                onPress={() => setShowProfileModal(true)}
                haptic="light"
                style={styles.infoBtn}
              >
                <Ionicons name="information-circle-outline" size={24} color={colors.textSecondary} />
              </ThemedTouchable>
            </View>

            {/* Linked Order Banner if present */}
            {conversation?.order && (
              <View
                style={[
                  styles.orderBanner,
                  {
                    backgroundColor: isDark ? '#1F2432' : '#EFF6FF',
                    borderColor: isDark ? '#2D3548' : '#DBEAFE',
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialCommunityIcons name="clipboard-text-outline" size={16} color={colors.primary} />
                  <Text style={[styles.orderBannerNumber, { color: colors.textPrimary }]}>
                    Pedido #{conversation.order.orderNumber}
                  </Text>
                </View>
                <View
                  style={[
                    styles.orderStatusPill,
                    {
                      backgroundColor:
                        conversation.order.status === 'COMPLETED'
                          ? '#D1FAE5'
                          : '#FEF3C7',
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontFamily: 'Satoshi-Bold',
                      color:
                        conversation.order.status === 'COMPLETED'
                          ? '#065F46'
                          : '#92400E',
                    }}
                  >
                    {conversation.order.status}
                  </Text>
                </View>
              </View>
            )}

            {/* Profile Modal */}
            <Modal
              visible={showProfileModal}
              animationType="slide"
              presentationStyle="pageSheet"
              onRequestClose={() => setShowProfileModal(false)}
            >
              <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                    Información del Contacto
                  </Text>
                  <ThemedTouchable onPress={() => setShowProfileModal(false)} haptic="light">
                    <Ionicons name="close" size={24} color={colors.textPrimary} />
                  </ThemedTouchable>
                </View>

                <ScrollView contentContainerStyle={{ padding: 22, alignItems: 'center' }}>
                  <View style={styles.modalAvatarLarge}>
                    {otherParticipant?.avatarUrl ? (
                      <Image source={{ uri: otherParticipant.avatarUrl }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <View style={{ width: '100%', height: '100%', backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 32, fontFamily: 'Satoshi-Black', color: colors.primary }}>
                          {(otherParticipant?.displayName || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.modalName, { color: colors.textPrimary }]}>
                    {otherParticipant?.displayName}
                  </Text>

                  {isOtherPro && (
                    <View style={styles.modalProTag}>
                      <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                      <Text style={styles.modalProTagText}>Profesional Verificado Yewi</Text>
                    </View>
                  )}

                  {otherParticipant?.city && (
                    <Text style={[styles.modalCity, { color: colors.textSecondary }]}>
                      📍 {otherParticipant.city}
                    </Text>
                  )}

                  {otherParticipant?.bio && (
                    <View style={[styles.modalBioBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                      <Text style={[styles.modalBioText, { color: colors.textPrimary }]}>
                        {otherParticipant.bio}
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </Modal>
          </View>
        </StreamChatView>
      );
    }

    const unreadTotalCount = conversationsList.reduce(
      (acc, c) =>
        acc +
        (c.messages?.filter((m) => !m.isRead && m.senderId !== user?.id).length || 0),
      0,
    );

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <View
          style={[
            styles.convContainer,
            { paddingTop: Math.max(insets.top, 16) },
          ]}
        >
          {/* 1. Stream SDK Inspired Channel Header */}
          <ChannelHeader
            otherParticipant={otherParticipant}
            fallbackName={params.targetName}
            unreadCount={unreadTotalCount}
            isTyping={isOtherTyping}
            onBack={() => setActiveTargetId(null)}
            onPressProfile={() => setShowProfileModal(true)}
          />

          {/* 2. Linked Order Banner if present */}
          {conversation?.order && (
            <View
              style={[
                styles.orderBanner,
                {
                  backgroundColor: isDark ? '#1F2432' : '#EFF6FF',
                  borderColor: isDark ? '#2D3548' : '#DBEAFE',
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={16} color={colors.primary} />
                <Text style={[styles.orderBannerNumber, { color: colors.textPrimary }]}>
                  Pedido #{conversation.order.orderNumber}
                </Text>
              </View>
              <View
                style={[
                  styles.orderStatusPill,
                  {
                    backgroundColor:
                      conversation.order.status === 'COMPLETED'
                        ? '#D1FAE5'
                        : '#FEF3C7',
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: 'Satoshi-Bold',
                    color:
                      conversation.order.status === 'COMPLETED'
                        ? '#065F46'
                        : '#92400E',
                  }}
                >
                  {conversation.order.status}
                </Text>
              </View>
            </View>
          )}

          {/* 3. Messages Feed with Stream SDK Style Bubbles & Attachments */}
          {isLoadingConv ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : errorConv ? (
            <View style={styles.centerLoading}>
              <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>{errorConv}</Text>
              <ThemedTouchable
                onPress={loadConversationDetail}
                haptic="medium"
                style={[styles.retryBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: '#FFFFFF', fontFamily: 'Satoshi-Bold' }}>Reintentar</Text>
              </ThemedTouchable>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 12, gap: 10 }}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
              renderItem={({ item }) => (
                <MessageBubble
                  message={item}
                  isMine={item.senderId === user?.id}
                  onLongPress={(msg) => setSelectedMessageForReactions(msg)}
                  onPressReaction={handleToggleReaction}
                  onPressImage={(url, caption) => setActiveImageViewer({ url, caption })}
                  currentUserId={user?.id}
                />
              )}
            />
          )}

          {/* 4. Bottom Input Composer with Attachments & Quick Actions */}
          <MessageInputComposer
            inputText={inputText}
            onChangeText={handleInputChange}
            onSendMessage={handleSendMessage}
            isSending={isSending}
            pendingAttachment={pendingAttachment}
            onRemovePendingAttachment={() => setPendingAttachment(null)}
            onSelectAttachment={(att) => setPendingAttachment(att)}
            onSelectQuickAction={(txt) => {
              setInputText(txt);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            }}
          />

          {/* 5. Floating Reactions Bar on Message Long Press */}
          <MessageReactionsBar
            visible={Boolean(selectedMessageForReactions)}
            onClose={() => setSelectedMessageForReactions(null)}
            onSelectEmoji={(emoji) => {
              if (selectedMessageForReactions) {
                handleToggleReaction(selectedMessageForReactions, emoji);
              }
            }}
            currentReactions={selectedMessageForReactions?.metadata?.reactions}
            currentUserId={user?.id}
          />

          {/* 6. Fullscreen Image Viewer Modal */}
          <ImageViewerModal
            visible={Boolean(activeImageViewer)}
            imageUrl={activeImageViewer?.url || null}
            caption={activeImageViewer?.caption}
            onClose={() => setActiveImageViewer(null)}
          />

          {/* 7. Contact Profile Modal */}
          <Modal
            visible={showProfileModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowProfileModal(false)}
          >
            <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  Información del Contacto
                </Text>
                <ThemedTouchable onPress={() => setShowProfileModal(false)} haptic="light">
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </ThemedTouchable>
              </View>

              <ScrollView contentContainerStyle={{ padding: 22, alignItems: 'center' }}>
                <View style={styles.modalAvatarLarge}>
                  {otherParticipant?.avatarUrl ? (
                    <Image source={{ uri: otherParticipant.avatarUrl }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <View style={{ width: '100%', height: '100%', backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 32, fontFamily: 'Satoshi-Black', color: colors.primary }}>
                        {(otherParticipant?.displayName || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.modalName, { color: colors.textPrimary }]}>
                  {otherParticipant?.displayName}
                </Text>

                {isOtherPro && (
                  <View style={styles.modalProTag}>
                    <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                    <Text style={styles.modalProTagText}>Profesional Verificado Yewi</Text>
                  </View>
                )}

                {otherParticipant?.city && (
                  <Text style={[styles.modalCity, { color: colors.textSecondary }]}>
                    📍 {otherParticipant.city}
                  </Text>
                )}

                {otherParticipant?.bio && (
                  <View style={[styles.modalBioBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                    <Text style={[styles.modalBioText, { color: colors.textPrimary }]}>
                      {otherParticipant.bio}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </Modal>
        </View>
      </KeyboardAvoidingView>
    );
  }


  // ==========================================
  // VIEW: WHATSAPP-STYLE CHAT HUB
  // ==========================================
  return (
    <View style={[styles.hubContainer, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.hubHeader,
          {
            paddingTop: Math.max(insets.top + 8, 20),
            backgroundColor: isDark ? '#161922' : '#FFFFFF',
            borderBottomColor: colors.borderSubtle,
          },
        ]}
      >
        <View style={styles.hubTitleRow}>
          <Text style={[styles.hubMainTitle, { color: colors.textPrimary }]}>
            Mensajes
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ThemedTouchable
              onPress={() => setActiveTab('CONTACTOS')}
              haptic="light"
              style={[styles.headerIconBtn, { backgroundColor: colors.surfaceAlt }]}
            >
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </ThemedTouchable>
          </View>
        </View>

        {/* WhatsApp-Style 3-Segment Tab Bar */}
        <View style={styles.tabBarRow}>
          <ThemedTouchable
            onPress={() => setActiveTab('CHATS')}
            haptic="light"
            style={[
              styles.tabItem,
              activeTab === 'CHATS' && [styles.activeTabItem, { borderBottomColor: colors.primary }],
            ]}
          >
            <Text
              style={[
                styles.tabItemText,
                { color: activeTab === 'CHATS' ? colors.primary : colors.textSecondary },
              ]}
            >
              CHATS
            </Text>
            {conversationsList.length > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.tabBadgeText}>{conversationsList.length}</Text>
              </View>
            )}
          </ThemedTouchable>

          <ThemedTouchable
            onPress={() => setActiveTab('ESTADOS')}
            haptic="light"
            style={[
              styles.tabItem,
              activeTab === 'ESTADOS' && [styles.activeTabItem, { borderBottomColor: colors.primary }],
            ]}
          >
            <Text
              style={[
                styles.tabItemText,
                { color: activeTab === 'ESTADOS' ? colors.primary : colors.textSecondary },
              ]}
            >
              ESTADOS
            </Text>
            {storiesFeed.length > 0 && (
              <View style={[styles.tabDot, { backgroundColor: '#10B981' }]} />
            )}
          </ThemedTouchable>

          <ThemedTouchable
            onPress={() => setActiveTab('CONTACTOS')}
            haptic="light"
            style={[
              styles.tabItem,
              activeTab === 'CONTACTOS' && [styles.activeTabItem, { borderBottomColor: colors.primary }],
            ]}
          >
            <Text
              style={[
                styles.tabItemText,
                { color: activeTab === 'CONTACTOS' ? colors.primary : colors.textSecondary },
              ]}
            >
              CONTACTOS
            </Text>
            {contactsList.length > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.tabBadgeText, { color: colors.textSecondary }]}>
                  {contactsList.length}
                </Text>
              </View>
            )}
          </ThemedTouchable>
        </View>
      </View>

      {/* Tab 1: CHATS */}
      {activeTab === 'CHATS' && (
        <View style={{ flex: 1 }}>
          <FlatList
            data={conversationsList}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={loadingConversations}
                onRefresh={loadConversations}
                tintColor={colors.primary}
              />
            }
            contentContainerStyle={{ paddingVertical: 8, paddingBottom: 90 }}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconCircle, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="chatbubbles-outline" size={44} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  No tienes conversaciones todavía
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Conecta con profesionales verificados o clientes desde el directorio para empezar a chatear en tiempo real.
                </Text>
                <ThemedTouchable
                  onPress={() => setActiveTab('CONTACTOS')}
                  haptic="medium"
                  style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="person-add" size={16} color="#FFFFFF" />
                  <Text style={styles.emptyBtnText}>Explorar Contactos</Text>
                </ThemedTouchable>
              </View>
            )}
            renderItem={({ item }) => {
              const other = item.otherParticipant;
              const lastMsg = item.messages?.[0];

              const timeFormatted = (() => {
                try {
                  const date = new Date(item.lastMessageAt || item.updatedAt);
                  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } catch {
                  return '';
                }
              })();

              return (
                <ThemedTouchable
                  onPress={() => setActiveTargetId(item.id)}
                  haptic="light"
                  style={[
                    styles.chatRowItem,
                    { borderBottomColor: isDark ? '#1C202C' : '#F1F5F9' },
                  ]}
                >
                  <View style={styles.chatAvatarWrap}>
                    {other?.avatarUrl ? (
                      <Image source={{ uri: other.avatarUrl }} style={styles.chatAvatar} contentFit="cover" />
                    ) : (
                      <View style={[styles.chatAvatarPlaceholder, { backgroundColor: colors.primaryLight }]}>
                        <Text style={[styles.chatInitial, { color: colors.primary }]}>
                          {(other?.displayName || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.chatOnlineDot} />
                    {other?.isPro && (
                      <View style={styles.chatProBadge}>
                        <Ionicons name="checkmark" size={7} color="#FFFFFF" />
                      </View>
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.chatNameRow}>
                      <Text numberOfLines={1} style={[styles.chatNameText, { color: colors.textPrimary }]}>
                        {other?.displayName || 'Conversación Yewi'}
                      </Text>
                      <Text style={[styles.chatTimeText, { color: colors.textMuted }]}>
                        {timeFormatted}
                      </Text>
                    </View>

                    <View style={styles.chatSnippetRow}>
                      <Text numberOfLines={1} style={[styles.chatSnippetText, { color: colors.textSecondary }]}>
                        {lastMsg?.content || 'Pulsa para ver los mensajes'}
                      </Text>
                      {item.order && (
                        <View style={[styles.orderTag, { backgroundColor: colors.primaryLight }]}>
                          <Text style={[styles.orderTagText, { color: colors.primary }]}>
                            #{item.order.orderNumber}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </ThemedTouchable>
              );
            }}
          />

          {/* Floating Action Button for New Chat */}
          <ThemedTouchable
            onPress={() => setActiveTab('CONTACTOS')}
            haptic="medium"
            style={[styles.floatingActionBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
          </ThemedTouchable>
        </View>
      )}

      {/* Tab 2: ESTADOS */}
      {activeTab === 'ESTADOS' && (
        <View style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={loadingStories}
                onRefresh={loadStories}
                tintColor={colors.primary}
              />
            }
            contentContainerStyle={{ paddingVertical: 14, paddingBottom: 90 }}
          >
            {/* Mi Estado Row */}
            <ThemedTouchable
              onPress={() => setIsCreateStatusOpen(true)}
              haptic="medium"
              style={[styles.myStatusRow, { borderBottomColor: isDark ? '#1C202C' : '#F1F5F9' }]}
            >
              <View style={styles.myStatusAvatarWrap}>
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.myStatusAvatar} contentFit="cover" />
                ) : (
                  <View style={[styles.myStatusPlaceholder, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name="person" size={24} color={colors.primary} />
                  </View>
                )}
                <View style={[styles.myStatusPlusBadge, { backgroundColor: colors.primary }]}>
                  <Ionicons name="add" size={14} color="#FFFFFF" />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.myStatusTitle, { color: colors.textPrimary }]}>
                  Mi estado
                </Text>
                <Text style={[styles.myStatusSubtitle, { color: colors.textSecondary }]}>
                  {user?.isPro || (user as any)?.professionalProfile?.isPro
                    ? 'Añade una actualización de tus trabajos'
                    : 'Desbloquea historias con Yewi Pro'}
                </Text>
              </View>
            </ThemedTouchable>

            {/* Estados Recientes & Vistos */}
            {(() => {
              const recentStories = storiesFeed.filter((g) => !isGroupSeen(g.statuses.map((s) => s.id)));
              const seenStories = storiesFeed.filter((g) => isGroupSeen(g.statuses.map((s) => s.id)));

              if (storiesFeed.length === 0) {
                return (
                  <View style={styles.emptyStoriesContainer}>
                    <Ionicons name="sparkles-outline" size={36} color={colors.textMuted} />
                    <Text style={[styles.emptyStoriesTitle, { color: colors.textPrimary }]}>
                      No hay estados recientes
                    </Text>
                    <Text style={[styles.emptyStoriesSubtitle, { color: colors.textSecondary }]}>
                      Los profesionales con Yewi Pro compartirán aquí sus reformas y fotos de trabajos activos.
                    </Text>
                  </View>
                );
              }

              return (
                <>
                  {/* 1. Recientes */}
                  {recentStories.length > 0 && (
                    <>
                      <View style={styles.storiesSectionHeader}>
                        <Text style={[styles.storiesSectionTitle, { color: colors.textMuted }]}>
                          ACTUALIZACIONES RECIENTES ({recentStories.length})
                        </Text>
                      </View>
                      {recentStories.map((group) => (
                        <ThemedTouchable
                          key={group.authorId}
                          onPress={() => setSelectedStoryGroup(group)}
                          haptic="medium"
                          style={[styles.storyRowItem, { borderBottomColor: isDark ? '#1C202C' : '#F1F5F9' }]}
                        >
                          <View style={[styles.storyRingWrap, { borderColor: colors.primary, borderWidth: 2.5 }]}>
                            {group.authorAvatar ? (
                              <Image source={{ uri: group.authorAvatar }} style={styles.storyRowAvatar} contentFit="cover" />
                            ) : (
                              <View style={[styles.storyRowPlaceholder, { backgroundColor: colors.primaryLight }]}>
                                <Text style={{ fontSize: 16, fontFamily: 'Satoshi-Bold', color: colors.primary }}>
                                  {(group.businessName || group.authorName).charAt(0).toUpperCase()}
                                </Text>
                              </View>
                            )}
                          </View>

                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text numberOfLines={1} style={[styles.storyRowName, { color: colors.textPrimary }]}>
                                {group.businessName || group.authorName}
                              </Text>
                              {group.isPro && (
                                <View style={styles.proChipSmall}>
                                  <Text style={styles.proChipSmallText}>PRO</Text>
                                </View>
                              )}
                            </View>
                            <Text style={[styles.storyRowCategory, { color: colors.textSecondary }]}>
                              {group.category || 'Profesional'} · {group.statuses.length} {group.statuses.length === 1 ? 'estado' : 'estados'}
                            </Text>
                          </View>
                        </ThemedTouchable>
                      ))}
                    </>
                  )}

                  {/* 2. Vistos */}
                  {seenStories.length > 0 && (
                    <>
                      <View style={[styles.storiesSectionHeader, { marginTop: recentStories.length > 0 ? 14 : 0 }]}>
                        <Text style={[styles.storiesSectionTitle, { color: colors.textMuted }]}>
                          ACTUALIZACIONES VISTAS ({seenStories.length})
                        </Text>
                      </View>
                      {seenStories.map((group) => (
                        <ThemedTouchable
                          key={group.authorId}
                          onPress={() => setSelectedStoryGroup(group)}
                          haptic="medium"
                          style={[styles.storyRowItem, { borderBottomColor: isDark ? '#1C202C' : '#F1F5F9', opacity: 0.82 }]}
                        >
                          <View style={[styles.storyRingWrap, { borderColor: isDark ? '#3F3F46' : '#CBD5E1', borderWidth: 1.5 }]}>
                            {group.authorAvatar ? (
                              <Image source={{ uri: group.authorAvatar }} style={styles.storyRowAvatar} contentFit="cover" />
                            ) : (
                              <View style={[styles.storyRowPlaceholder, { backgroundColor: colors.primaryLight }]}>
                                <Text style={{ fontSize: 16, fontFamily: 'Satoshi-Bold', color: colors.primary }}>
                                  {(group.businessName || group.authorName).charAt(0).toUpperCase()}
                                </Text>
                              </View>
                            )}
                          </View>

                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text numberOfLines={1} style={[styles.storyRowName, { color: colors.textPrimary }]}>
                                {group.businessName || group.authorName}
                              </Text>
                              {group.isPro && (
                                <View style={styles.proChipSmall}>
                                  <Text style={styles.proChipSmallText}>PRO</Text>
                                </View>
                              )}
                            </View>
                            <Text style={[styles.storyRowCategory, { color: colors.textSecondary }]}>
                              {group.category || 'Profesional'} · {group.statuses.length} {group.statuses.length === 1 ? 'estado' : 'estados'}
                            </Text>
                          </View>
                        </ThemedTouchable>
                      ))}
                    </>
                  )}
                </>
              );
            })()}
          </ScrollView>

          {/* Floating Action Button for New Status */}
          <ThemedTouchable
            onPress={() => setIsCreateStatusOpen(true)}
            haptic="medium"
            style={[styles.floatingActionBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="camera" size={24} color="#FFFFFF" />
          </ThemedTouchable>
        </View>
      )}

      {/* Tab 3: CONTACTOS */}
      {activeTab === 'CONTACTOS' && (
        <View style={{ flex: 1 }}>
          {/* Search Box */}
          <View style={[styles.contactSearchWrap, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={contactSearchQuery}
              onChangeText={setContactSearchQuery}
              placeholder="Buscar por nombre, categoría o ciudad..."
              placeholderTextColor={colors.textMuted}
              style={[styles.contactSearchInput, { color: colors.textPrimary }]}
            />
            {Boolean(contactSearchQuery) && (
              <ThemedTouchable onPress={() => setContactSearchQuery('')} haptic="light">
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </ThemedTouchable>
            )}
          </View>

          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={loadingContacts}
                onRefresh={loadContacts}
                tintColor={colors.primary}
              />
            }
            contentContainerStyle={{ paddingVertical: 8 }}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={44} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  {contactSearchQuery ? 'Sin resultados para la búsqueda' : 'No hay contactos disponibles'}
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  {contactSearchQuery
                    ? 'Intenta buscar con otros términos.'
                    : 'Explora profesionales en el buscador o publica una solicitud para conectar con especialistas.'}
                </Text>
              </View>
            )}
            renderItem={({ item }) => (
              <ThemedTouchable
                onPress={() => handleStartChatWithContact(item)}
                haptic="light"
                style={[
                  styles.contactRowItem,
                  { borderBottomColor: isDark ? '#1C202C' : '#F1F5F9' },
                ]}
              >
                <View style={styles.contactAvatarWrap}>
                  {item.avatarUrl ? (
                    <Image source={{ uri: item.avatarUrl }} style={styles.contactAvatar} contentFit="cover" />
                  ) : (
                    <View style={[styles.contactAvatarPlaceholder, { backgroundColor: colors.primaryLight }]}>
                      <Text style={[styles.contactInitial, { color: colors.primary }]}>
                        {item.displayName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  {item.isPro && (
                    <View style={styles.contactProBadge}>
                      <Ionicons name="checkmark" size={7} color="#FFFFFF" />
                    </View>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text numberOfLines={1} style={[styles.contactName, { color: colors.textPrimary }]}>
                      {item.displayName}
                    </Text>
                    {item.rating > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <Text style={{ fontSize: 12, fontFamily: 'Satoshi-Bold', color: colors.textPrimary }}>
                          {item.rating.toFixed(1)}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text numberOfLines={1} style={[styles.contactCategory, { color: colors.textSecondary }]}>
                    {item.category ? `${item.category} · ` : ''}{item.city || 'España'}
                  </Text>
                </View>

                <ThemedTouchable
                  onPress={() => handleStartChatWithContact(item)}
                  haptic="medium"
                  style={[styles.startChatBtn, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="chatbubble" size={13} color="#FFFFFF" />
                  <Text style={styles.startChatBtnText}>Chatear</Text>
                </ThemedTouchable>
              </ThemedTouchable>
            )}
          />
        </View>
      )}

      {/* Modals for Stories */}
      <StatusViewerModal
        visible={Boolean(selectedStoryGroup)}
        storyGroup={selectedStoryGroup}
        onClose={() => setSelectedStoryGroup(null)}
        onStoryUpdated={() => {
          loadStories();
          loadConversations();
        }}
        onOpenChatWithUser={(targetUserId, targetName, initialMsg) => {
          setSelectedStoryGroup(null);
          if (initialMsg) {
            setInputText(initialMsg);
          }
          setActiveTargetId(targetUserId);
        }}
      />

      <CreateStatusModal
        visible={isCreateStatusOpen}
        onClose={() => setIsCreateStatusOpen(false)}
        onStatusCreated={() => {
          loadStories();
          loadConversations();
        }}
      />

      <FloatingActionButton />
    </View>
  );
}

const styles = StyleSheet.create({
  // 1-on-1 Conversation styles
  convContainer: {
    flex: 1,
  },
  convHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
    marginRight: 4,
  },
  convAvatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    position: 'relative',
    overflow: 'visible',
  },
  convAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  convAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  convAvatarInitial: {
    fontSize: 16,
    fontFamily: 'Satoshi-Black',
  },
  convProBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#10B981',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  convNameText: {
    fontSize: 15,
    fontFamily: 'Satoshi-Bold',
  },
  convStatusText: {
    fontSize: 11.5,
    fontFamily: 'Satoshi-Medium',
  },
  infoBtn: {
    padding: 6,
  },
  orderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  orderBannerNumber: {
    fontSize: 12.5,
    fontFamily: 'Satoshi-Bold',
  },
  orderStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  messageRow: {
    flexDirection: 'row',
    width: '100%',
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  storyQuoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    borderLeftWidth: 3.5,
    marginBottom: 8,
    gap: 8,
  },
  storyQuoteLabel: {
    fontSize: 11,
    fontFamily: 'Satoshi-Bold',
    marginBottom: 2,
  },
  storyQuoteCaption: {
    fontSize: 12,
    fontFamily: 'Satoshi-Regular',
  },
  storyQuoteThumb: {
    width: 38,
    height: 38,
    borderRadius: 6,
  },
  myBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageContent: {
    fontSize: 14,
    fontFamily: 'Satoshi-Regular',
    lineHeight: 20,
  },
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
    fontFamily: 'Satoshi-Regular',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 8,
    gap: 10,
    borderTopWidth: 1,
  },
  textInputBox: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  mainInput: {
    fontSize: 14,
    fontFamily: 'Satoshi-Regular',
    padding: 0,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: 'Satoshi-Black',
  },
  modalAvatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    marginBottom: 12,
  },
  modalName: {
    fontSize: 20,
    fontFamily: 'Satoshi-Black',
    marginBottom: 4,
  },
  modalProTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  modalProTagText: {
    fontSize: 12,
    fontFamily: 'Satoshi-Bold',
    color: '#10B981',
  },
  modalCity: {
    fontSize: 13,
    fontFamily: 'Satoshi-Medium',
    marginBottom: 16,
  },
  modalBioBox: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  modalBioText: {
    fontSize: 13.5,
    fontFamily: 'Satoshi-Regular',
    lineHeight: 20,
  },

  // Hub styles
  hubContainer: {
    flex: 1,
  },
  hubHeader: {
    borderBottomWidth: 1,
  },
  hubTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  hubMainTitle: {
    fontSize: 26,
    fontFamily: 'Satoshi-Black',
    letterSpacing: -0.5,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {},
  tabItemText: {
    fontSize: 13,
    fontFamily: 'Satoshi-Bold',
    letterSpacing: 0.5,
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  tabBadgeText: {
    fontSize: 10,
    fontFamily: 'Satoshi-Bold',
    color: '#FFFFFF',
  },
  tabDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Satoshi-Black',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13.5,
    fontFamily: 'Satoshi-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    height: 46,
    borderRadius: 23,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Satoshi-Bold',
  },
  chatRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 14,
    borderBottomWidth: 1,
  },
  chatAvatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    position: 'relative',
  },
  chatOnlineDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  floatingActionBtn: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  chatAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
  },
  chatAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatInitial: {
    fontSize: 20,
    fontFamily: 'Satoshi-Black',
  },
  chatProBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#10B981',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chatNameText: {
    fontSize: 15.5,
    fontFamily: 'Satoshi-Bold',
    maxWidth: '75%',
  },
  chatTimeText: {
    fontSize: 11,
    fontFamily: 'Satoshi-Regular',
  },
  chatSnippetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatSnippetText: {
    fontSize: 13.5,
    fontFamily: 'Satoshi-Regular',
    maxWidth: '75%',
  },
  orderTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  orderTagText: {
    fontSize: 10,
    fontFamily: 'Satoshi-Bold',
  },
  myStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
  },
  myStatusAvatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    position: 'relative',
  },
  myStatusAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 27,
  },
  myStatusPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myStatusPlusBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  myStatusTitle: {
    fontSize: 15.5,
    fontFamily: 'Satoshi-Bold',
  },
  myStatusSubtitle: {
    fontSize: 12.5,
    fontFamily: 'Satoshi-Regular',
    marginTop: 2,
  },
  storiesSectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  storiesSectionTitle: {
    fontSize: 11.5,
    fontFamily: 'Satoshi-Black',
    letterSpacing: 0.6,
  },
  emptyStoriesContainer: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 30,
    gap: 8,
  },
  emptyStoriesTitle: {
    fontSize: 15,
    fontFamily: 'Satoshi-Bold',
  },
  emptyStoriesSubtitle: {
    fontSize: 12.5,
    fontFamily: 'Satoshi-Regular',
    textAlign: 'center',
    lineHeight: 18,
  },
  storyRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 14,
    borderBottomWidth: 1,
  },
  storyRingWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2.5,
    padding: 2,
    overflow: 'hidden',
  },
  storyRowAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  storyRowPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyRowName: {
    fontSize: 15,
    fontFamily: 'Satoshi-Bold',
  },
  proChipSmall: {
    backgroundColor: '#10B981',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  proChipSmallText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Satoshi-Black',
  },
  storyRowCategory: {
    fontSize: 12,
    fontFamily: 'Satoshi-Regular',
    marginTop: 2,
  },
  contactSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    gap: 8,
  },
  contactSearchInput: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: 'Satoshi-Regular',
    padding: 0,
  },
  contactRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  contactAvatarWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    position: 'relative',
  },
  contactAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 23,
  },
  contactAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInitial: {
    fontSize: 18,
    fontFamily: 'Satoshi-Black',
  },
  contactProBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#10B981',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  contactName: {
    fontSize: 15,
    fontFamily: 'Satoshi-Bold',
    maxWidth: '70%',
  },
  contactCategory: {
    fontSize: 12,
    fontFamily: 'Satoshi-Regular',
    marginTop: 2,
  },
  startChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
  },
  startChatBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Satoshi-Bold',
  },
});
