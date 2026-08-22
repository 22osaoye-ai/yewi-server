import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AntiFraudUtils } from '../../common/utils/anti-fraud.utils';
import { PrismaService } from '../../database/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Buscar o crear automáticamente la conversación por ConversationId u OrderId
   */
  async findOrCreateConversation(userId: string, targetId: string) {
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          { id: targetId },
          { orderId: targetId },
          { serviceRequestId: targetId },
        ],
      },
    });

    if (!conversation) {
      // Comprobar si targetId es un OrderId
      const order = await this.prisma.order.findUnique({
        where: { id: targetId },
        include: { professionalProfile: true },
      });

      if (order) {
        if (
          order.clientId !== userId &&
          order.professionalProfile.userId !== userId
        ) {
          throw new ForbiddenException('No autorizado en este pedido');
        }

        conversation = await this.prisma.conversation.create({
          data: {
            orderId: order.id,
            participantAId: order.clientId,
            participantBId: order.professionalProfile.userId,
          },
        });
      }
    }

    return conversation;
  }

  /**
   * Obtener conversaciones del usuario
   */
  async getMyConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        OR: [{ participantAId: userId }, { participantBId: userId }],
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
        serviceRequest: {
          select: {
            id: true,
            title: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Obtener historial de mensajes de una conversación
   */
  async getMessages(userId: string, conversationOrOrderId: string) {
    const conversation = await this.findOrCreateConversation(
      userId,
      conversationOrOrderId,
    );

    if (!conversation) {
      throw new NotFoundException('Conversación no encontrada');
    }

    if (
      conversation.participantAId !== userId &&
      conversation.participantBId !== userId
    ) {
      throw new ForbiddenException('No tienes acceso a esta conversación');
    }

    // Marcar mensajes no leídos como leídos
    await this.prisma.message.updateMany({
      where: {
        conversationId: conversation.id,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    const messages = await this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      include: {
        sender: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      conversationId: conversation.id,
      orderId: conversation.orderId,
      messages,
    };
  }

  /**
   * Enviar un mensaje con protección anti-fraude
   */
  async sendMessage(userId: string, dto: SendMessageDto) {
    const conversation = await this.findOrCreateConversation(
      userId,
      dto.conversationId,
    );

    if (!conversation) {
      throw new NotFoundException('Conversación no encontrada');
    }

    if (
      conversation.participantAId !== userId &&
      conversation.participantBId !== userId
    ) {
      throw new ForbiddenException('No autorizado en esta conversación');
    }

    // Aplicar filtro anti-fraude si el pedido no está creado o no está pagado
    let content = dto.content;
    const isOrderActive =
      conversation.orderId &&
      conversation.orderId.length > 0;

    if (!isOrderActive) {
      content = AntiFraudUtils.sanitizeText(content);
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        type: dto.type,
        content,
        attachments: dto.attachments ?? [],
        metadata: dto.metadata,
      },
      include: {
        sender: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
      },
    });

    return message;
  }
}
