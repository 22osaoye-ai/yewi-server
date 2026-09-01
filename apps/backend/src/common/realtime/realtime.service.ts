import { Injectable } from '@nestjs/common';
import { RealtimeGateway, userRoom } from './realtime.gateway';

export interface NotificationEvent {
  id: string | null;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  metadata?: unknown;
  isRead: boolean;
  createdAt: Date | null;
}

export interface LeadEvent {
  id: string;
  clientId: string;
  categoryId: string;
  title: string;
  description: string;
  city: string;
  isUrgent: boolean;
  budgetMin: unknown;
  budgetMax: unknown;
  creditCost: number;
  status: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface SubscriptionUpdatedEvent {
  userId: string;
  isPro: boolean;
  status: string;
  subscriptionId: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export interface StatusCreatedEvent {
  status: any;
  authorGroup: any;
}

export interface StatusCommentEvent {
  statusId: string;
  comment: any;
}

export interface StatusReactionEvent {
  statusId: string;
  userId: string;
  reactionType: string | null;
  likesCount: number;
}

@Injectable()
export class RealtimeService {
  constructor(private readonly gateway: RealtimeGateway) {}

  emitNotification(notification: NotificationEvent) {
    this.gateway.server
      ?.to(userRoom(notification.userId))
      .emit('notification:new', notification);
  }

  emitLead(userId: string, lead: LeadEvent) {
    this.gateway.server?.to(userRoom(userId)).emit('lead:new', {
      id: lead.id,
      clientId: lead.clientId,
      categoryId: lead.categoryId,
      title: lead.title,
      description: lead.description,
      city: lead.city,
      isUrgent: lead.isUrgent,
      budgetMin: lead.budgetMin,
      budgetMax: lead.budgetMax,
      creditCost: lead.creditCost,
      status: lead.status,
      createdAt: lead.createdAt,
      expiresAt: lead.expiresAt,
    });
  }

  emitSubscriptionUpdated(event: SubscriptionUpdatedEvent) {
    this.gateway.server
      ?.to(userRoom(event.userId))
      .emit('subscription:updated', event);
  }

  emitStatusCreated(event: StatusCreatedEvent) {
    this.gateway.server?.emit('status:new', event);
  }

  emitStatusComment(event: StatusCommentEvent) {
    this.gateway.server?.emit('status:comment:new', event);
  }

  emitStatusReaction(event: StatusReactionEvent) {
    this.gateway.server?.emit('status:reaction:update', event);
  }

  emitStatusViewed(event: { statusId: string; viewCount: number; authorId: string }) {
    this.gateway.server?.emit('status:view:update', event);
  }

  emitNewChatMessage(
    conversationId: string,
    message: any,
    participantIds?: string[],
  ) {
    // 1. Emit to active conversation room
    this.gateway.server
      ?.to(`conversation_${conversationId}`)
      .emit('new_message', message);
    this.gateway.server?.emit('chat:message:new', { conversationId, message });

    // 2. Emit to user private rooms so chat hubs update in real-time
    if (participantIds && Array.isArray(participantIds)) {
      for (const pId of participantIds) {
        if (pId) {
          this.gateway.server
            ?.to(userRoom(pId))
            .emit('chat:conversation:update', { conversationId, message });
        }
      }
    }
  }

  emitChatMessageReaction(
    conversationId: string,
    messageId: string,
    reactions: any[],
    participantIds?: string[],
  ) {
    this.gateway.server
      ?.to(`conversation_${conversationId}`)
      .emit('chat:message:reaction', { conversationId, messageId, reactions });

    if (participantIds && Array.isArray(participantIds)) {
      for (const pId of participantIds) {
        if (pId) {
          this.gateway.server
            ?.to(userRoom(pId))
            .emit('chat:message:reaction', { conversationId, messageId, reactions });
        }
      }
    }
  }
}

