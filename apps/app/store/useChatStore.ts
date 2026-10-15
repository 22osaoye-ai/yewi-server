import { create } from 'zustand';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  chatApi,
  ChatMessage,
  ConversationDetail,
  ConversationItem,
  ContactItem,
} from '@/services/chatApi';
import { statusesApi, AuthorStatusFeedGroup } from '@/services/statusesApi';
import { realtimeService } from '@/services/realtimeService';
import { useFavoritesStore } from './useFavoritesStore';
import { useAuthStore } from './useAuthStore';

const STORAGE_CONVERSATIONS = '@yewi_cached_conversations';
const STORAGE_CONTACTS = '@yewi_cached_contacts';

interface ConversationCacheItem {
  detail: ConversationDetail;
  messages: ChatMessage[];
  lastFetched: number;
}

interface ChatState {
  // Hub Data Cache
  conversations: ConversationItem[];
  storiesFeed: AuthorStatusFeedGroup[];
  contacts: ContactItem[];

  // 1-on-1 Messages Cache (keyed by conversationId or targetUserId/orderId)
  conversationCache: Record<string, ConversationCacheItem>;
  activeConversationId: string | null;

  // Realtime Statuses
  isTypingByConv: Record<string, boolean>;
  isObserverInitialized: boolean;

  // Granular Loading Flags (No-Flash)
  isConversationsLoading: boolean;
  isStoriesLoading: boolean;
  isContactsLoading: boolean;
  isConversationLoading: boolean;

  // Timestamps for Stale-While-Revalidate (TTL: 60s)
  lastConversationsFetchedAt: number;
  lastStoriesFetchedAt: number;
  lastContactsFetchedAt: number;

  // Actions
  initializeChatCache: () => Promise<void>;
  fetchConversations: (force?: boolean) => Promise<void>;
  fetchStories: (force?: boolean) => Promise<void>;
  fetchContacts: (force?: boolean) => Promise<void>;
  fetchConversationDetail: (targetId: string, force?: boolean) => Promise<ConversationDetail | null>;
  setActiveConversationId: (convId: string | null) => void;

  // Message Actions
  addOptimisticMessage: (targetId: string, message: ChatMessage) => void;
  replaceOptimisticMessage: (targetId: string, tempId: string, realMessage: ChatMessage) => void;
  removeOptimisticMessage: (targetId: string, tempId: string) => void;
  toggleMessageReaction: (
    convId: string,
    messageId: string,
    emoji: string,
    userId: string,
    userName: string
  ) => void;

  // Realtime Observer Management
  initRealtimeObserver: () => void;
  cleanupRealtimeObserver: () => void;
}

const CACHE_TTL_MS = 45_000; // 45 seconds Stale-While-Revalidate

let observerUnsubscribers: (() => void)[] = [];

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  storiesFeed: [],
  contacts: [],
  conversationCache: {},
  activeConversationId: null,
  isTypingByConv: {},
  isObserverInitialized: false,

  isConversationsLoading: false,
  isStoriesLoading: false,
  isContactsLoading: false,
  isConversationLoading: false,

  lastConversationsFetchedAt: 0,
  lastStoriesFetchedAt: 0,
  lastContactsFetchedAt: 0,

  setActiveConversationId: (activeConversationId) => {
    set({ activeConversationId });
  },

  // 0. Initialize Cache from local disk (0ms instant display on boot)
  initializeChatCache: async () => {
    try {
      const [cachedConvs, cachedContacts] = await Promise.all([
        AsyncStorage.getItem(STORAGE_CONVERSATIONS),
        AsyncStorage.getItem(STORAGE_CONTACTS),
      ]);
      const updates: Partial<ChatState> = {};
      if (cachedConvs) {
        try {
          const parsed = JSON.parse(cachedConvs);
          if (Array.isArray(parsed) && parsed.length > 0) {
            updates.conversations = parsed;
          }
        } catch {}
      }
      if (cachedContacts) {
        try {
          const parsed = JSON.parse(cachedContacts);
          if (Array.isArray(parsed) && parsed.length > 0) {
            updates.contacts = parsed;
          }
        } catch {}
      }
      if (Object.keys(updates).length > 0) {
        set(updates);
      }
    } catch (e) {
      console.warn('[useChatStore] Error reading local chat cache:', e);
    }
  },

  // 1. Fetch Conversations (Cache-First / SWR)
  fetchConversations: async (force = false) => {
    const { conversations, lastConversationsFetchedAt } = get();
    const isStale = Date.now() - lastConversationsFetchedAt > CACHE_TTL_MS;

    // If cache is fresh and not forced, reuse cache (0 ms response)
    if (!force && conversations.length > 0 && !isStale) {
      return;
    }

    // Only set loading indicator if we don't have cached data to prevent layout shift
    if (conversations.length === 0) {
      set({ isConversationsLoading: true });
    }

    try {
      const data = await chatApi.getMyConversations();
      const list = Array.isArray(data) ? data : [];
      set({
        conversations: list,
        lastConversationsFetchedAt: Date.now(),
        isConversationsLoading: false,
      });
      AsyncStorage.setItem(STORAGE_CONVERSATIONS, JSON.stringify(list)).catch(() => {});
    } catch (err) {
      console.warn('[useChatStore] Error fetching conversations:', err);
      set({ isConversationsLoading: false });
    }
  },

  // 2. Fetch Stories Feed (Cache-First / SWR)
  fetchStories: async (force = false) => {
    const { storiesFeed, lastStoriesFetchedAt } = get();
    const isStale = Date.now() - lastStoriesFetchedAt > CACHE_TTL_MS;

    if (!force && storiesFeed.length > 0 && !isStale) {
      return;
    }

    if (storiesFeed.length === 0) {
      set({ isStoriesLoading: true });
    }

    try {
      const favs = useFavoritesStore.getState().favorites;
      const feed = await statusesApi.getFeed(favs);
      set({
        storiesFeed: Array.isArray(feed) ? feed : [],
        lastStoriesFetchedAt: Date.now(),
        isStoriesLoading: false,
      });
    } catch (err) {
      console.warn('[useChatStore] Error fetching stories:', err);
      set({ isStoriesLoading: false });
    }
  },

  // 3. Fetch Contacts (Cache-First / SWR)
  fetchContacts: async (force = false) => {
    const { contacts, lastContactsFetchedAt } = get();
    const isStale = Date.now() - lastContactsFetchedAt > CACHE_TTL_MS * 2;

    if (!force && contacts.length > 0 && !isStale) {
      return;
    }

    if (contacts.length === 0) {
      set({ isContactsLoading: true });
    }

    try {
      const data = await chatApi.getContacts();
      const list = Array.isArray(data) ? data : [];
      set({
        contacts: list,
        lastContactsFetchedAt: Date.now(),
        isContactsLoading: false,
      });
      AsyncStorage.setItem(STORAGE_CONTACTS, JSON.stringify(list)).catch(() => {});
    } catch (err) {
      console.warn('[useChatStore] Error fetching contacts:', err);
      set({ isContactsLoading: false });
    }
  },

  // 4. Fetch 1-on-1 Conversation Detail and Messages (Cache-First)
  fetchConversationDetail: async (targetId: string, force = false) => {
    if (!targetId) return null;

    const { conversationCache } = get();
    const cached = conversationCache[targetId];
    const isStale = !cached || Date.now() - cached.lastFetched > CACHE_TTL_MS;

    // Return immediately if cached and fresh
    if (!force && cached && !isStale) {
      return cached.detail;
    }

    // Only show full loading if nothing is cached for this chat yet
    if (!cached) {
      set({ isConversationLoading: true });
    }

    try {
      const detail = await chatApi.getMessages(targetId);
      const messages = detail.messages || [];

      set((state) => ({
        conversationCache: {
          ...state.conversationCache,
          [targetId]: {
            detail,
            messages,
            lastFetched: Date.now(),
          },
          ...(detail.conversationId && detail.conversationId !== targetId
            ? {
                [detail.conversationId]: {
                  detail,
                  messages,
                  lastFetched: Date.now(),
                },
              }
            : {}),
        },
        isConversationLoading: false,
      }));

      return detail;
    } catch (err) {
      console.warn('[useChatStore] Error fetching conversation detail:', err);
      set({ isConversationLoading: false });
      return cached?.detail || null;
    }
  },

  // 5. Optimistic Message Manipulation
  addOptimisticMessage: (targetId: string, message: ChatMessage) => {
    set((state) => {
      const cached = state.conversationCache[targetId];
      if (!cached) return state;

      const nextMessages = [...cached.messages, message];

      // Also update conversations list preview snippet
      const nextConversations = state.conversations.map((c) => {
        if (c.id === message.conversationId || c.id === targetId) {
          return {
            ...c,
            lastMessageAt: message.createdAt,
            messages: [message],
          };
        }
        return c;
      });

      return {
        conversationCache: {
          ...state.conversationCache,
          [targetId]: {
            ...cached,
            messages: nextMessages,
          },
        },
        conversations: nextConversations,
      };
    });
  },

  replaceOptimisticMessage: (targetId: string, tempId: string, realMessage: ChatMessage) => {
    set((state) => {
      const cached = state.conversationCache[targetId];
      if (!cached) return state;

      const nextMessages = cached.messages.map((m) => (m.id === tempId ? realMessage : m));

      return {
        conversationCache: {
          ...state.conversationCache,
          [targetId]: {
            ...cached,
            messages: nextMessages,
          },
        },
      };
    });
  },

  removeOptimisticMessage: (targetId: string, tempId: string) => {
    set((state) => {
      const cached = state.conversationCache[targetId];
      if (!cached) return state;

      return {
        conversationCache: {
          ...state.conversationCache,
          [targetId]: {
            ...cached,
            messages: cached.messages.filter((m) => m.id !== tempId),
          },
        },
      };
    });
  },

  // 6. Optimistic Toggle Reaction
  toggleMessageReaction: (convId, messageId, emoji, userId, userName) => {
    set((state) => {
      const cached = state.conversationCache[convId];
      if (!cached) return state;

      const nextMessages = cached.messages.map((m) => {
        if (m.id !== messageId) return m;

        const currentReactions = m.metadata?.reactions || [];
        const existingIdx = currentReactions.findIndex(
          (r) => r.emoji === emoji && r.userId === userId
        );

        let nextReactions;
        if (existingIdx !== -1) {
          nextReactions = currentReactions.filter((_, idx) => idx !== existingIdx);
        } else {
          nextReactions = [...currentReactions, { emoji, userId, userName }];
        }

        return {
          ...m,
          metadata: {
            ...m.metadata,
            reactions: nextReactions,
          },
        };
      });

      return {
        conversationCache: {
          ...state.conversationCache,
          [convId]: {
            ...cached,
            messages: nextMessages,
          },
        },
      };
    });
  },

  // 7. Persistent Realtime Observer Pattern
  initRealtimeObserver: () => {
    if (get().isObserverInitialized) return;

    // Clean any prior dangling subscriptions
    observerUnsubscribers.forEach((u) => u());
    observerUnsubscribers = [];

    // Observer: Incoming New Message
    const unsubNewMsg = realtimeService.on('chat:message:new', (data) => {
      if (!data?.conversationId || !data?.message) return;
      const convId = data.conversationId;
      const newMsg: ChatMessage = data.message;

      set((state) => {
        // Update in-memory messages for this conversation if open or cached
        const cached = state.conversationCache[convId];
        let nextCache = state.conversationCache;

        if (cached) {
          const alreadyExists = cached.messages.some((m) => m.id === newMsg.id);
          if (!alreadyExists) {
            // Replace matching optimistic temp message if found
            const tempIdx = cached.messages.findIndex(
              (m) =>
                m.id.startsWith('temp-') &&
                m.senderId === newMsg.senderId &&
                m.content === newMsg.content
            );

            let nextMessages;
            if (tempIdx !== -1) {
              nextMessages = [...cached.messages];
              nextMessages[tempIdx] = newMsg;
            } else {
              nextMessages = [...cached.messages, newMsg];
            }

            nextCache = {
              ...state.conversationCache,
              [convId]: {
                ...cached,
                messages: nextMessages,
              },
            };
          }
        }

        // Update conversations list preview and move conversation to top
        const existsInList = state.conversations.some((c) => c.id === convId);
        let nextConversations = [...state.conversations];

        if (existsInList) {
          nextConversations = nextConversations.map((c) => {
            if (c.id === convId) {
              return {
                ...c,
                lastMessageAt: newMsg.createdAt,
                messages: [newMsg],
              };
            }
            return c;
          });
          // Sort to top
          nextConversations.sort(
            (a, b) =>
              new Date(b.lastMessageAt || 0).getTime() -
              new Date(a.lastMessageAt || 0).getTime()
          );
        } else {
          // New conversation created externally
          get().fetchConversations(true);
        }

        return {
          conversationCache: nextCache,
          conversations: nextConversations,
        };
      });
    });

    // Observer: Message Reactions Update
    const unsubReaction = realtimeService.on('chat:message:reaction', (data) => {
      if (!data?.conversationId || !data?.messageId) return;
      const { conversationId, messageId, reactions } = data;

      set((state) => {
        const cached = state.conversationCache[conversationId];
        if (!cached) return state;

        const nextMessages = cached.messages.map((m) =>
          m.id === messageId
            ? {
                ...m,
                metadata: {
                  ...m.metadata,
                  reactions,
                },
              }
            : m
        );

        return {
          conversationCache: {
            ...state.conversationCache,
            [conversationId]: {
              ...cached,
              messages: nextMessages,
            },
          },
        };
      });
    });

    // Observer: Conversation Metadata Updates
    const unsubConvUpdate = realtimeService.on('chat:conversation:update', () => {
      get().fetchConversations(true);
    });

    // Observer: User Typing Indicator
    const unsubTyping = realtimeService.on('user_typing', (data) => {
      if (!data?.conversationId) return;
      const currentUserId = useAuthStore.getState().user?.id;
      if (data.userId === currentUserId) return;

      set((state) => ({
        isTypingByConv: {
          ...state.isTypingByConv,
          [data.conversationId]: Boolean(data.isTyping),
        },
      }));
    });

    // Observer: Status / Stories Updates
    const unsubStatusNew = realtimeService.on('status:new', (data) => {
      if (data?.authorGroup) {
        set((state) => {
          const filtered = state.storiesFeed.filter(
            (g) => g.authorId !== data.authorGroup.authorId
          );
          return { storiesFeed: [data.authorGroup, ...filtered] };
        });
      } else {
        get().fetchStories(true);
      }
    });

    const unsubStatusView = realtimeService.on('status:view:update', (data) => {
      if (!data?.statusId) return;
      set((state) => ({
        storiesFeed: state.storiesFeed.map((group) => ({
          ...group,
          statuses: group.statuses.map((st) =>
            st.id === data.statusId ? { ...st, viewCount: data.viewCount } : st
          ),
        })),
      }));
    });

    observerUnsubscribers = [
      unsubNewMsg,
      unsubReaction,
      unsubConvUpdate,
      unsubTyping,
      unsubStatusNew,
      unsubStatusView,
    ];

    set({ isObserverInitialized: true });
  },

  cleanupRealtimeObserver: () => {
    observerUnsubscribers.forEach((u) => u());
    observerUnsubscribers = [];
    set({ isObserverInitialized: false });
  },
}));

// Run chat cache initialization on boot (guarded for SSR)
if (Platform.OS !== 'web' || typeof window !== 'undefined') {
  useChatStore.getState().initializeChatCache();
}

