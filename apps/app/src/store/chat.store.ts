import { io, Socket } from 'socket.io-client';
import { create } from 'zustand';
import { api } from '../services/api';
import { ChatMessage } from '../types';

interface ChatState {
  socket: Socket | null;
  isConnected: boolean;
  messages: Record<string, ChatMessage[]>;
  typingUsers: Record<string, boolean>;
  connect: () => void;
  disconnect: () => void;
  fetchMessages: (conversationId: string) => Promise<void>;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendMessage: (userId: string, conversationId: string, content: string) => Promise<void>;
  sendTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
}

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'http://localhost:3000/chat';

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  isConnected: false,
  messages: {},
  typingUsers: {},

  connect: () => {
    if (get().socket) return;

    try {
      const socket = io(WS_URL, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
      });

      socket.on('connect', () => {
        set({ isConnected: true });
      });

      socket.on('disconnect', () => {
        set({ isConnected: false });
      });

      socket.on('connect_error', (err: any) => {
        // Log and keep state updated for UI
        // eslint-disable-next-line no-console
        console.warn('WS connect_error', err?.message || err);
        set({ isConnected: false });
      });

      socket.on('new_message', (message: ChatMessage & { conversationId?: string }) => {
        if (message.conversationId) {
          get().addMessage(message.conversationId, message);
        }
      });

      socket.on('user_typing', (data: { conversationId: string; isTyping: boolean }) => {
        set((state) => ({
          typingUsers: {
            ...state.typingUsers,
            [data.conversationId]: data.isTyping,
          },
        }));
      });

      set({ socket });
    } catch {
      // Ignorar fallos de WS en entornos móviles sin gateway activo
    }
  },


  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  fetchMessages: async (conversationId: string) => {
    try {
      const res: any = await api.get(`/chat/conversations/${conversationId}/messages`);
      const data = res.data || res;
      const messageList = Array.isArray(data) ? data : data.messages || [];

      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: messageList,
        },
      }));
    } catch {
      // En caso de conversación nueva sin mensajes
    }
  },

  joinConversation: (conversationId: string) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('join_conversation', { conversationId });
    }
    // Cargar historial por HTTP
    get().fetchMessages(conversationId);
  },

  leaveConversation: (conversationId: string) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('leave_conversation', { conversationId });
    }
  },

  sendMessage: async (userId: string, conversationId: string, content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    // 1. Mensaje optimista para actualización visual instantánea
    const optimisticMessage: ChatMessage = {
      id: `temp_${Date.now()}`,
      conversationId,
      senderId: userId,
      type: 'TEXT',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    get().addMessage(conversationId, optimisticMessage);

    // 2. Emitir por WebSocket si está conectado
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('send_message', {
        userId,
        dto: {
          conversationId,
          content: trimmed,
        },
      });
    }

    // 3. Persistir en base de datos vía HTTP REST
    try {
      const res: any = await api.post('/chat/messages', {
        conversationId,
        content: trimmed,
      });

      const serverMsg = res.data || res;
      if (serverMsg && serverMsg.id) {
        // Reemplazar mensaje temporal con el del servidor
        set((state) => {
          const current = state.messages[conversationId] || [];
          return {
            messages: {
              ...state.messages,
              [conversationId]: current.map((m) =>
                m.id === optimisticMessage.id ? serverMsg : m,
              ),
            },
          };
        });
      }
    } catch {
      // Si falla, el mensaje se mantendrá visible
    }
  },

  sendTyping: (conversationId: string, userId: string, isTyping: boolean) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('typing', { conversationId, userId, isTyping });
    }
  },

  addMessage: (conversationId: string, message: ChatMessage) => {
    set((state) => {
      const current = state.messages[conversationId] || [];
      // Evitar duplicados por ID
      if (current.some((m) => m.id === message.id)) {
        return state;
      }
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...current, message],
        },
      };
    });
  },
}));
