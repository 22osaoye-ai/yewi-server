import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StreamChat } from 'stream-chat';
import { AntiFraudUtils } from '../../common/utils/anti-fraud.utils';
import { RealtimeService } from '../../common/realtime/realtime.service';
import { PrismaService } from '../../database/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeService: RealtimeService,
  ) {}

  /**
   * Buscar o crear automáticamente la conversación por ConversationId u OrderId o ServiceRequestId o UserId/ProProfileId
   */
  async findOrCreateConversation(userId: string, targetId: string) {
    if (targetId === userId) {
      throw new BadRequestException(
        'No puedes iniciar una conversación contigo mismo',
      );
    }

    let conversation = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          { id: targetId },
          { orderId: targetId },
          { serviceRequestId: targetId },
          {
            AND: [
              { participantAId: userId },
              { participantBId: targetId },
            ],
          },
          {
            AND: [
              { participantAId: targetId },
              { participantBId: userId },
            ],
          },
        ],
      },
    });

    if (!conversation) {
      // 1. Comprobar si targetId es un OrderId
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

        if (order.clientId === order.professionalProfile.userId) {
          throw new BadRequestException(
            'El cliente y el profesional no pueden ser el mismo usuario',
          );
        }

        conversation = await this.prisma.conversation.create({
          data: {
            orderId: order.id,
            serviceRequestId: order.serviceRequestId,
            participantAId: order.clientId,
            participantBId: order.professionalProfile.userId,
          },
        });
      } else {
        // 2. Comprobar si targetId es un ServiceRequestId con orden o propuesta aceptada
        const req = await this.prisma.serviceRequest.findUnique({
          where: { id: targetId },
          include: {
            orders: {
              include: { professionalProfile: true },
              take: 1,
            },
          },
        });

        if (req && req.orders.length > 0) {
          const activeOrder = req.orders[0];
          if (
            req.clientId !== userId &&
            activeOrder.professionalProfile.userId !== userId
          ) {
            throw new ForbiddenException('No autorizado en esta solicitud');
          }

          if (req.clientId === activeOrder.professionalProfile.userId) {
            throw new BadRequestException(
              'No puedes iniciar una conversación contigo mismo',
            );
          }

          conversation = await this.prisma.conversation.create({
            data: {
              orderId: activeOrder.id,
              serviceRequestId: req.id,
              participantAId: req.clientId,
              participantBId: activeOrder.professionalProfile.userId,
            },
          });
        } else {
          // 3. Comprobar si targetId es un ProfessionalProfileId o un UserId directo
          const pro = await this.prisma.professionalProfile.findUnique({
            where: { id: targetId },
            select: { userId: true },
          });

          const targetUserId = pro ? pro.userId : targetId;

          if (targetUserId === userId) {
            throw new BadRequestException(
              'No puedes iniciar una conversación con tu propio perfil',
            );
          }

          if (targetUserId) {
            const targetUser = await this.prisma.user.findUnique({
              where: { id: targetUserId },
            });

            if (targetUser) {
              // Buscar si ya existe una conversación directa entre ambos
              conversation = await this.prisma.conversation.findFirst({
                where: {
                  OR: [
                    {
                      AND: [
                        { participantAId: userId },
                        { participantBId: targetUserId },
                      ],
                    },
                    {
                      AND: [
                        { participantAId: targetUserId },
                        { participantBId: userId },
                      ],
                    },
                  ],
                },
              });

              if (!conversation) {
                conversation = await this.prisma.conversation.create({
                  data: {
                    participantAId: userId,
                    participantBId: targetUserId,
                  },
                });
              }
            }
          }
        }
      }
    }

    return conversation;
  }

  /**
   * Obtener conversaciones del usuario con datos de perfil del interlocutor
   */
  async getMyConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ participantAId: userId }, { participantBId: userId }],
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            escrowStatus: true,
          },
        },
        serviceRequest: {
          select: {
            id: true,
            title: true,
            city: true,
            category: { select: { name: true } },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const otherUserIds = Array.from(
      new Set(
        conversations.map((c) =>
          c.participantAId === userId ? c.participantBId : c.participantAId,
        ),
      ),
    );

    const otherUsers = await this.prisma.user.findMany({
      where: { id: { in: otherUserIds } },
      select: {
        id: true,
        email: true,
        isPro: true,
        roles: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            displayName: true,
            avatarUrl: true,
            phoneNumber: true,
            city: true,
            address: true,
          },
        },
        professionalProfile: {
          select: {
            id: true,
            businessName: true,
            bio: true,
            avgRating: true,
            totalReviews: true,
            badges: true,
            skills: true,
          },
        },
      },
    });

    const userMap = new Map(otherUsers.map((u) => [u.id, u]));

    return conversations.map((conv) => {
      const otherId =
        conv.participantAId === userId
          ? conv.participantBId
          : conv.participantAId;
      const otherUser = userMap.get(otherId);

      return {
        ...conv,
        otherParticipant: otherUser
          ? {
              id: otherUser.id,
              email: otherUser.email,
              isPro: otherUser.isPro,
              roles: otherUser.roles,
              displayName:
                otherUser.professionalProfile?.businessName ||
                otherUser.profile?.displayName ||
                `${otherUser.profile?.firstName ?? ''} ${otherUser.profile?.lastName ?? ''}`.trim() ||
                'Usuario Yewi',
              avatarUrl: otherUser.profile?.avatarUrl,
              phone: otherUser.profile?.phoneNumber,
              city: otherUser.profile?.city,
              rating: otherUser.professionalProfile?.avgRating ?? 5.0,
              totalReviews: otherUser.professionalProfile?.totalReviews ?? 0,
              badges: otherUser.professionalProfile?.badges ?? [],
              businessName: otherUser.professionalProfile?.businessName,
              profile: otherUser.profile,
              professionalProfile: otherUser.professionalProfile,
            }
          : null,
      };
    });
  }

  /**
   * Obtener historial de mensajes de una conversación con detalle de participantes y pedido
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
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Obtener información detallada del otro participante
    const otherParticipantId =
      conversation.participantAId === userId
        ? conversation.participantBId
        : conversation.participantAId;

    const otherUser = await this.prisma.user.findUnique({
      where: { id: otherParticipantId },
      select: {
        id: true,
        email: true,
        isPro: true,
        roles: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            displayName: true,
            avatarUrl: true,
            phoneNumber: true,
            city: true,
            postalCode: true,
            address: true,
            bio: true,
          },
        },
        professionalProfile: {
          select: {
            id: true,
            businessName: true,
            bio: true,
            hourlyRate: true,
            avgRating: true,
            totalReviews: true,
            completedOrdersCount: true,
            badges: true,
            skills: true,
          },
        },
      },
    });

    // Obtener detalles del pedido si existe
    let orderInfo: any = null;
    if (conversation.orderId) {
      orderInfo = await this.prisma.order.findUnique({
        where: { id: conversation.orderId },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          subtotal: true,
          platformFee: true,
          escrowStatus: true,
          deliveryDeadline: true,
        },
      });
    }

    // Obtener detalles de la solicitud de servicio si existe
    let serviceRequestInfo: any = null;
    if (conversation.serviceRequestId) {
      serviceRequestInfo = await this.prisma.serviceRequest.findUnique({
        where: { id: conversation.serviceRequestId },
        select: {
          id: true,
          title: true,
          description: true,
          city: true,
          postalCode: true,
          status: true,
          category: {
            select: { name: true, slug: true },
          },
        },
      });
    }

    const otherParticipant = otherUser
      ? {
          id: otherUser.id,
          email: otherUser.email,
          isPro: otherUser.isPro,
          roles: otherUser.roles,
          displayName:
            otherUser.professionalProfile?.businessName ||
            otherUser.profile?.displayName ||
            `${otherUser.profile?.firstName ?? ''} ${otherUser.profile?.lastName ?? ''}`.trim() ||
            'Usuario Yewi',
          avatarUrl: otherUser.profile?.avatarUrl,
          phone: otherUser.profile?.phoneNumber,
          city: otherUser.profile?.city,
          address: otherUser.profile?.address,
          postalCode: otherUser.profile?.postalCode,
          rating: otherUser.professionalProfile?.avgRating ?? 5.0,
          totalReviews: otherUser.professionalProfile?.totalReviews ?? 0,
          completedOrdersCount:
            otherUser.professionalProfile?.completedOrdersCount ?? 0,
          badges: otherUser.professionalProfile?.badges ?? [],
          skills: otherUser.professionalProfile?.skills ?? [],
          bio:
            otherUser.professionalProfile?.bio ||
            otherUser.profile?.bio ||
            undefined,
          businessName: otherUser.professionalProfile?.businessName,
          profile: otherUser.profile,
          professionalProfile: otherUser.professionalProfile,
        }
      : null;

    return {
      conversationId: conversation.id,
      orderId: conversation.orderId,
      serviceRequestId: conversation.serviceRequestId,
      otherParticipant,
      order: orderInfo,
      serviceRequest: serviceRequestInfo,
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
      conversation.orderId && conversation.orderId.length > 0;

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
                displayName: true,
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

    const recipientId =
      conversation.participantAId === userId
        ? conversation.participantBId
        : conversation.participantAId;

    // Realtime message broadcast to conversation room and participants
    this.realtimeService.emitNewChatMessage(
      conversation.id,
      message,
      recipientId ? [userId, recipientId] : [userId],
    );

    // Notificar en tiempo real al otro participante
    if (recipientId && recipientId !== userId) {
      try {
        const senderName =
          message.sender?.profile?.displayName ||
          [
            message.sender?.profile?.firstName,
            message.sender?.profile?.lastName,
          ]
            .filter(Boolean)
            .join(' ') ||
          'Usuario Yewi';

        const notif = await this.prisma.notification.create({
          data: {
            userId: recipientId,
            type: 'SYSTEM_ALERT',
            title: `💬 Mensaje de ${senderName}`,
            message:
              content.length > 100 ? `${content.slice(0, 97)}...` : content,
            link: `/chat?conversationId=${conversation.id}`,
            metadata: {
              conversationId: conversation.id,
              senderId: userId,
              senderName,
              messageId: message.id,
            },
          },
        });

        this.realtimeService.emitNotification({
          id: notif.id,
          userId: recipientId,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          link: notif.link,
          metadata: notif.metadata,
          isRead: notif.isRead,
          createdAt: notif.createdAt,
        });
      } catch (notifErr) {
        // Silently catch to not block message return
      }
    }

    return message;
  }

  /**
   * Genera token seguro de Stream Chat para el cliente autenticado y sincroniza su usuario
   */
  async getStreamToken(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        professionalProfile: true,
        subscription: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const apiKey = process.env.STREAM_API_KEY || 'yewi_stream_app_key';
    const apiSecret = process.env.STREAM_API_SECRET || 'yewi_stream_secret_default_key_32bytes_minimum';

    const displayName =
      user.professionalProfile?.businessName ||
      user.profile?.displayName ||
      (user.profile?.firstName
        ? `${user.profile.firstName} ${user.profile.lastName ?? ''}`.trim()
        : 'Usuario Yewi');

    const avatarUrl = user.profile?.avatarUrl || undefined;

    let token: string;
    try {
      const serverClient = StreamChat.getInstance(apiKey, apiSecret);
      token = serverClient.createToken(userId);

      // Sincronizar metadatos en Stream
      serverClient
        .upsertUser({
          id: userId,
          name: displayName,
          image: avatarUrl,
          role: user.roles.includes('ADMIN') ? 'admin' : 'user',
        })
        .catch(() => {
          // Ignorado en caso de modo offline/dev
        });
    } catch (err) {
      token = `stream_token_${userId}`;
    }

    return {
      apiKey,
      token,
      userId,
      user: {
        id: userId,
        name: displayName,
        image: avatarUrl,
        isPro: user.isPro || user.professionalProfile?.isPro,
      },
    };
  }

  /**
   * Obtener lista de contactos reales para el usuario (clientes/sellers vinculados y profesionales verificados)
   */
  async getContacts(userId: string) {
    // 1. Obtener conversaciones existentes para saber con quién ha hablado
    const existingConversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ participantAId: userId }, { participantBId: userId }],
      },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const interactedUserIds = new Set<string>();
    const conversationMap = new Map<
      string,
      { conversationId: string; lastMessage?: string; lastMessageAt?: Date }
    >();

    for (const conv of existingConversations) {
      const otherId =
        conv.participantAId === userId ? conv.participantBId : conv.participantAId;
      if (otherId && otherId !== userId) {
        interactedUserIds.add(otherId);
        conversationMap.set(otherId, {
          conversationId: conv.id,
          lastMessage: conv.messages[0]?.content,
          lastMessageAt: conv.messages[0]?.createdAt || conv.updatedAt,
        });
      }
    }

    // 2. Obtener usuarios de pedidos reales
    const userOrders = await this.prisma.order.findMany({
      where: {
        OR: [{ clientId: userId }, { professionalProfile: { userId } }],
      },
      include: {
        client: true,
        professionalProfile: true,
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    for (const order of userOrders) {
      if (order.clientId !== userId) interactedUserIds.add(order.clientId);
      if (order.professionalProfile.userId !== userId) {
        interactedUserIds.add(order.professionalProfile.userId);
      }
    }

    // 3. Obtener profesionales verificados / activos en Yewi
    const verifiedPros = await this.prisma.professionalProfile.findMany({
      where: {
        userId: { not: userId },
        user: { isActive: true },
      },
      include: {
        user: {
          include: {
            profile: true,
            subscription: true,
          },
        },
        categories: true,
      },
      take: 30,
      orderBy: [{ isPro: 'desc' }, { avgRating: 'desc' }],
    });

    const verifiedProUserIds = verifiedPros.map((p) => p.userId);
    const allTargetUserIds = Array.from(
      new Set([...Array.from(interactedUserIds), ...verifiedProUserIds]),
    );

    const users = await this.prisma.user.findMany({
      where: {
        id: { in: allTargetUserIds },
        isActive: true,
      },
      include: {
        profile: true,
        professionalProfile: {
          include: {
            categories: true,
          },
        },
        subscription: true,
      },
    });

    return users
      .map((u) => {
        const isPro = Boolean(
          u.isPro ||
            u.professionalProfile?.isPro ||
            (u.subscription &&
              (u.subscription.status === 'ACTIVE' ||
                u.subscription.status === 'TRIALING')),
        );

        const proProfile = u.professionalProfile;
        const profile = u.profile;

        const displayName =
          proProfile?.businessName ||
          profile?.displayName ||
          (profile?.firstName
            ? `${profile.firstName} ${profile.lastName ?? ''}`.trim()
            : 'Usuario Yewi');

        const convInfo = conversationMap.get(u.id);

        return {
          id: u.id,
          email: u.email,
          roles: u.roles,
          isPro,
          displayName,
          businessName: proProfile?.businessName || null,
          avatarUrl: profile?.avatarUrl || null,
          phone: profile?.phoneNumber || null,
          city: proProfile?.city || profile?.city || null,
          category: proProfile?.categories?.[0]?.name || null,
          rating: proProfile?.avgRating ?? 5.0,
          totalReviews: proProfile?.totalReviews ?? 0,
          conversationId: convInfo?.conversationId || null,
          lastMessage: convInfo?.lastMessage || null,
          lastMessageAt: convInfo?.lastMessageAt || null,
          hasExistingConversation: Boolean(convInfo),
        };
      })
      .sort((a, b) => {
        if (a.hasExistingConversation && !b.hasExistingConversation) return -1;
        if (!a.hasExistingConversation && b.hasExistingConversation) return 1;
        if (a.isPro && !b.isPro) return -1;
        if (!a.isPro && b.isPro) return 1;
        return a.displayName.localeCompare(b.displayName);
      });
  }

  /**
   * Alternar reacción de emoji en un mensaje (estilo Stream Chat SDK)
   */
  async toggleReaction(userId: string, messageId: string, emoji: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Mensaje no encontrado');
    }

    if (
      message.conversation.participantAId !== userId &&
      message.conversation.participantBId !== userId
    ) {
      throw new ForbiddenException('No autorizado en esta conversación');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, professionalProfile: true },
    });

    const userName =
      user?.professionalProfile?.businessName ||
      user?.profile?.displayName ||
      user?.profile?.firstName ||
      'Usuario';

    const currentMetadata = (message.metadata as Record<string, any>) || {};
    const currentReactions: Array<{ emoji: string; userId: string; userName: string }> =
      Array.isArray(currentMetadata.reactions) ? currentMetadata.reactions : [];

    const existingIndex = currentReactions.findIndex(
      (r) => r.userId === userId && r.emoji === emoji,
    );

    let updatedReactions: Array<{ emoji: string; userId: string; userName: string }>;

    if (existingIndex >= 0) {
      // Toggle off
      updatedReactions = currentReactions.filter((_, idx) => idx !== existingIndex);
    } else {
      // Toggle on: replace existing reaction from same user or append
      const otherReactions = currentReactions.filter((r) => r.userId !== userId);
      updatedReactions = [...otherReactions, { emoji, userId, userName }];
    }

    const updatedMetadata = {
      ...currentMetadata,
      reactions: updatedReactions,
    };

    await this.prisma.message.update({
      where: { id: messageId },
      data: { metadata: updatedMetadata },
    });

    this.realtimeService.emitChatMessageReaction(
      message.conversationId,
      messageId,
      updatedReactions,
      [message.conversation.participantAId, message.conversation.participantBId],
    );

    // Si es una nueva reacción, notificar en tiempo real al otro participante
    const recipientId =
      message.conversation.participantAId === userId
        ? message.conversation.participantBId
        : message.conversation.participantAId;

    if (existingIndex < 0 && recipientId && recipientId !== userId) {
      try {
        const notif = await this.prisma.notification.create({
          data: {
            userId: recipientId,
            type: 'SYSTEM_ALERT',
            title: `${emoji} ${userName} reaccionó a tu mensaje`,
            message: `"${message.content.length > 50 ? message.content.slice(0, 47) + '...' : message.content}"`,
            link: `/chat?conversationId=${message.conversationId}`,
            metadata: {
              conversationId: message.conversationId,
              senderId: userId,
              senderName: userName,
              messageId: message.id,
              emoji,
            },
          },
        });
        this.realtimeService.emitNotification(notif);
      } catch (notifErr) {
        console.warn('[ChatService] Error al generar notificación de reacción:', notifErr);
      }
    }

    return {
      messageId,
      conversationId: message.conversationId,
      reactions: updatedReactions,
    };
  }

  /**
   * Subir archivo adjunto (imágenes, documentos PDF/Excel/Word) a almacenamiento seguro
   */
  async uploadAttachment(
    userId: string,
    fileBase64OrUrl: string,
    fileName?: string,
    mimeType?: string,
    fileSize?: number,
  ) {
    let finalUrl = fileBase64OrUrl;
    let computedSize = fileSize || 0;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret && fileBase64OrUrl.startsWith('data:')) {
      try {
        const { v2: cloudinary } = await import('cloudinary');
        cloudinary.config({
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret,
          secure: true,
        });

        const uploadResult = await cloudinary.uploader.upload(fileBase64OrUrl, {
          folder: 'yewi/chat_attachments',
          resource_type: 'auto',
        });

        finalUrl = uploadResult.secure_url;
        computedSize = uploadResult.bytes || computedSize;
      } catch (err) {
        console.warn('[ChatService] Cloudinary upload fallback note:', err);
      }
    }

    const extension = fileName?.split('.').pop()?.toLowerCase() || '';
    let categoryType: 'pdf' | 'excel' | 'word' | 'image' | 'file' = 'file';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension) || mimeType?.startsWith('image/')) {
      categoryType = 'image';
    } else if (extension === 'pdf' || mimeType?.includes('pdf')) {
      categoryType = 'pdf';
    } else if (['xlsx', 'xls', 'csv'].includes(extension) || mimeType?.includes('spreadsheet') || mimeType?.includes('csv')) {
      categoryType = 'excel';
    } else if (['doc', 'docx'].includes(extension) || mimeType?.includes('word')) {
      categoryType = 'word';
    }

    return {
      url: finalUrl,
      name: fileName || 'archivo_adjunto',
      size: computedSize,
      type: categoryType,
      mimeType: mimeType || 'application/octet-stream',
    };
  }
}

