import { apiRequest } from './apiClient';

export interface ChatParticipant {
  id: string;
  email?: string;
  displayName: string;
  avatarUrl?: string;
  phone?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  rating?: number;
  totalReviews?: number;
  completedOrdersCount?: number;
  badges?: string[];
  skills?: string[];
  bio?: string;
  businessName?: string;
  isPro?: boolean;
  roles?: string[];
  profile?: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    avatarUrl?: string;
    phoneNumber?: string;
    city?: string;
    postalCode?: string;
    address?: string;
    bio?: string;
  };
  professionalProfile?: {
    id?: string;
    businessName?: string;
    bio?: string;
    hourlyRate?: number;
    avgRating?: number;
    totalReviews?: number;
    completedOrdersCount?: number;
    badges?: string[];
    skills?: string[];
  };
}

export interface AttachmentMeta {
  url: string;
  name: string;
  size: number;
  type: 'pdf' | 'excel' | 'word' | 'image' | 'file';
  mimeType?: string;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  userName: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  type: 'TEXT' | 'ATTACHMENT' | 'CUSTOM_OFFER' | 'SYSTEM_EVENT';
  content: string;
  attachments?: string[];
  metadata?: {
    attachmentsMeta?: AttachmentMeta[];
    reactions?: MessageReaction[];
    isStatusReply?: boolean;
    statusId?: string;
    statusCaption?: string;
    statusMediaUrl?: string;
    [key: string]: any;
  };
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  sender?: {
    id: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      displayName?: string;
      avatarUrl?: string;
    };
  };
}

export interface ConversationItem {
  id: string;
  orderId?: string;
  serviceRequestId?: string;
  participantAId: string;
  participantBId: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  otherParticipant?: ChatParticipant;
  order?: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount?: number;
    escrowStatus?: string;
  };
  serviceRequest?: {
    id: string;
    title: string;
    city?: string;
    category?: { name: string };
  };
  messages?: ChatMessage[];
}

export interface ConversationDetail {
  conversationId: string;
  orderId?: string;
  serviceRequestId?: string;
  otherParticipant?: ChatParticipant;
  order?: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    subtotal: number;
    platformFee: number;
    escrowStatus: string;
    deliveryDeadline?: string;
  };
  serviceRequest?: {
    id: string;
    title: string;
    description: string;
    city: string;
    postalCode?: string;
    status: string;
    category?: { name: string; slug?: string };
  };
  messages: ChatMessage[];
}

export interface StreamTokenResponse {
  apiKey: string;
  token: string;
  userId: string;
  user: {
    id: string;
    name: string;
    image?: string;
    isPro?: boolean;
  };
}

export interface ContactItem {
  id: string;
  email: string;
  roles: string[];
  isPro: boolean;
  displayName: string;
  businessName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  city: string | null;
  category: string | null;
  rating: number;
  totalReviews: number;
  conversationId: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  hasExistingConversation: boolean;
}

export const chatApi = {
  // 1. Listar todas las conversaciones activas del usuario
  async getMyConversations(): Promise<ConversationItem[]> {
    return apiRequest<ConversationItem[]>('/chat/conversations', {
      method: 'GET',
    });
  },

  // 2. Obtener historial y detalle de una conversación (por conversationId u orderId o requestId)
  async getMessages(conversationOrOrderId: string): Promise<ConversationDetail> {
    return apiRequest<ConversationDetail>(`/chat/conversations/${conversationOrOrderId}/messages`, {
      method: 'GET',
    });
  },

  // 3. Enviar mensaje en una conversación
  async sendMessage(data: {
    conversationId: string;
    content: string;
    type?: 'TEXT' | 'ATTACHMENT' | 'CUSTOM_OFFER' | 'SYSTEM_EVENT';
    attachments?: string[];
    metadata?: Record<string, any>;
  }): Promise<ChatMessage> {
    return apiRequest<ChatMessage>('/chat/messages', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: data.conversationId,
        content: data.content,
        type: data.type || 'TEXT',
        attachments: data.attachments || [],
        metadata: data.metadata,
      }),
    });
  },

  // 4. Alternar reacción de emoji a un mensaje
  async toggleReaction(
    messageId: string,
    emoji: string,
  ): Promise<{ messageId: string; conversationId: string; reactions: MessageReaction[] }> {
    return apiRequest<{ messageId: string; conversationId: string; reactions: MessageReaction[] }>(
      `/chat/messages/${messageId}/reaction`,
      {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      },
    );
  },

  // 5. Subir archivo adjunto para el chat
  async uploadAttachment(data: {
    file: string;
    fileName?: string;
    mimeType?: string;
    size?: number;
  }): Promise<AttachmentMeta> {
    return apiRequest<AttachmentMeta>('/chat/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 6. Obtener token seguro de Stream Chat para el usuario autenticado
  async getStreamToken(): Promise<StreamTokenResponse> {
    return apiRequest<StreamTokenResponse>('/chat/stream-token', {
      method: 'GET',
    });
  },

  // 7. Obtener lista de contactos reales para iniciar o continuar chats
  async getContacts(): Promise<ContactItem[]> {
    return apiRequest<ContactItem[]>('/chat/contacts', {
      method: 'GET',
    });
  },
};

