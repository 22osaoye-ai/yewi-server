import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { StreamChat } from 'stream-chat';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeService } from '../../common/realtime/realtime.service';
import { CreateStatusDto } from './dto/create-status.dto';
import { CreateStatusCommentDto } from './dto/create-comment.dto';
import { ReactStatusDto } from './dto/react-status.dto';
import { StatusMediaType } from '@prisma/client';

export interface AuthorStatusFeedGroup {
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  businessName: string | null;
  isPro: boolean;
  category: string | null;
  hasUnseen: boolean;
  latestStatusCreatedAt: Date;
  statuses: any[];
}

@Injectable()
export class StatusesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeService: RealtimeService,
  ) {}

  /**
   * Valida si un usuario tiene suscripción Yewi Pro activa
   */
  hasActiveProAccess(user: {
    isPro?: boolean;
    professionalProfile?: { isPro?: boolean } | null;
    subscription?: { status?: string } | null;
  }): boolean {
    if (!user) return false;
    if (user.isPro) return true;
    if (user.professionalProfile?.isPro) return true;
    if (
      user.subscription &&
      (user.subscription.status === 'ACTIVE' ||
        user.subscription.status === 'TRIALING')
    ) {
      return true;
    }
    return false;
  }

  /**
   * Obtener feed de estados agrupados por autor para Home y tab de Estados
   */
  async getFeed(currentUserId?: string): Promise<AuthorStatusFeedGroup[]> {
    const now = new Date();

    const statuses = await this.prisma.status.findMany({
      where: {
        expiresAt: { gt: now },
      },
      include: {
        author: {
          include: {
            profile: true,
            professionalProfile: {
              include: {
                categories: true,
              },
            },
            subscription: true,
          },
        },
        comments: {
          include: {
            author: {
              include: {
                profile: true,
                professionalProfile: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        reactions: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const groupsMap = new Map<string, AuthorStatusFeedGroup>();

    for (const status of statuses) {
      const author = status.author;
      const authorProfile = author.profile;
      const proProfile = author.professionalProfile;
      const isPro = this.hasActiveProAccess(author);

      const authorName =
        proProfile?.businessName ||
        authorProfile?.displayName ||
        (authorProfile?.firstName
          ? `${authorProfile.firstName} ${authorProfile.lastName ?? ''}`.trim()
          : 'Profesional Yewi');

      const authorAvatar = authorProfile?.avatarUrl || null;
      const categoryName = proProfile?.categories?.[0]?.name || null;

      const isLikedByCurrentUser = currentUserId
        ? status.reactions.some((r) => r.userId === currentUserId)
        : false;

      const currentUserReaction = currentUserId
        ? status.reactions.find((r) => r.userId === currentUserId)?.reactionType || null
        : null;

      const formattedStatus = {
        id: status.id,
        authorId: status.authorId,
        mediaUrl: status.mediaUrl,
        mediaType: status.mediaType,
        caption: status.caption,
        backgroundColor: status.backgroundColor,
        viewCount: status.viewCount,
        expiresAt: status.expiresAt,
        createdAt: status.createdAt,
        likesCount: status.reactions.length,
        commentsCount: status.comments.length,
        isLikedByMe: isLikedByCurrentUser,
        myReaction: currentUserReaction,
        comments: status.comments.map((c) => ({
          id: c.id,
          authorId: c.authorId,
          authorName:
            c.author.professionalProfile?.businessName ||
            c.author.profile?.displayName ||
            (c.author.profile?.firstName
              ? `${c.author.profile.firstName} ${c.author.profile.lastName ?? ''}`.trim()
              : 'Usuario Yewi'),
          authorAvatar: c.author.profile?.avatarUrl || null,
          content: c.content,
          createdAt: c.createdAt,
        })),
      };

      if (!groupsMap.has(status.authorId)) {
        groupsMap.set(status.authorId, {
          authorId: status.authorId,
          authorName,
          authorAvatar,
          businessName: proProfile?.businessName || null,
          isPro,
          category: categoryName,
          hasUnseen: true,
          latestStatusCreatedAt: status.createdAt,
          statuses: [formattedStatus],
        });
      } else {
        const group = groupsMap.get(status.authorId)!;
        group.statuses.push(formattedStatus);
        if (status.createdAt > group.latestStatusCreatedAt) {
          group.latestStatusCreatedAt = status.createdAt;
        }
      }
    }

    return Array.from(groupsMap.values()).sort(
      (a, b) => b.latestStatusCreatedAt.getTime() - a.latestStatusCreatedAt.getTime(),
    );
  }

  /**
   * Crear estado (Exclusivo para profesionales con Yewi Pro activo)
   */
  async createStatus(userId: string, dto: CreateStatusDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
        professionalProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isPro = this.hasActiveProAccess(user);
    if (!isPro) {
      throw new ForbiddenException(
        'Solo los profesionales con suscripción Yewi Pro activa pueden publicar estados.',
      );
    }

    if (!dto.mediaUrl && !dto.caption) {
      throw new BadRequestException('El estado debe tener al menos una imagen/vídeo o un texto.');
    }

    let finalMediaUrl = dto.mediaUrl || null;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (
      dto.mediaUrl &&
      (dto.mediaUrl.startsWith('data:image') || dto.mediaUrl.startsWith('file://')) &&
      cloudName &&
      apiKey &&
      apiSecret
    ) {
      try {
        cloudinary.config({
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret,
          secure: true,
        });

        const uploadResult = await cloudinary.uploader.upload(dto.mediaUrl, {
          folder: 'yewi/statuses',
          resource_type: dto.mediaType === StatusMediaType.VIDEO ? 'video' : 'image',
        });
        finalMediaUrl = uploadResult.secure_url;
      } catch (err) {
        console.warn('Cloudinary upload warning:', err);
      }
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const createdStatus = await this.prisma.status.create({
      data: {
        authorId: userId,
        mediaUrl: finalMediaUrl,
        mediaType: dto.mediaType || (finalMediaUrl ? StatusMediaType.IMAGE : StatusMediaType.TEXT),
        caption: dto.caption || null,
        backgroundColor: dto.backgroundColor || null,
        expiresAt,
      },
      include: {
        author: {
          include: {
            profile: true,
            professionalProfile: {
              include: { categories: true },
            },
            subscription: true,
          },
        },
      },
    });

    // Realtime broadcast with ALL active concatenated statuses for this author
    try {
      const fullFeed = await this.getFeed();
      const updatedAuthorGroup = fullFeed.find((g) => g.authorId === userId);

      if (updatedAuthorGroup) {
        this.realtimeService.emitStatusCreated({
          status: createdStatus,
          authorGroup: updatedAuthorGroup,
        });
      }
    } catch {
      // Silently catch realtime broadcast failures
    }

    return createdStatus;
  }

  /**
   * Obtener detalle de estado e incrementar contador de vistas
   */
  async getStatusById(statusId: string, currentUserId?: string) {
    const status = await this.prisma.status.findUnique({
      where: { id: statusId },
      include: {
        author: {
          include: {
            profile: true,
            professionalProfile: true,
            subscription: true,
          },
        },
        comments: {
          include: {
            author: {
              include: {
                profile: true,
                professionalProfile: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        reactions: true,
      },
    });

    if (!status) {
      throw new NotFoundException('Estado no encontrado');
    }

    await this.prisma.status.update({
      where: { id: statusId },
      data: { viewCount: { increment: 1 } },
    });

    const newViewCount = status.viewCount + 1;

    try {
      this.realtimeService.emitStatusViewed({
        statusId,
        viewCount: newViewCount,
        authorId: status.authorId,
      });
    } catch {}

    const isLiked = currentUserId
      ? status.reactions.some((r) => r.userId === currentUserId)
      : false;

    return {
      ...status,
      viewCount: newViewCount,
      isLikedByMe: isLiked,
    };
  }

  /**
   * Añadir comentario a un estado
   */
  async addComment(userId: string, statusId: string, dto: CreateStatusCommentDto) {
    const status = await this.prisma.status.findUnique({
      where: { id: statusId },
      include: { author: { include: { profile: true, professionalProfile: true } } },
    });

    if (!status) {
      throw new NotFoundException('El estado no existe');
    }

    if (new Date() > status.expiresAt) {
      throw new BadRequestException('Este estado ya ha expirado');
    }

    const comment = await this.prisma.statusComment.create({
      data: {
        statusId,
        authorId: userId,
        content: dto.content.trim(),
      },
      include: {
        author: {
          include: {
            profile: true,
            professionalProfile: true,
          },
        },
      },
    });

    const commentAuthorName =
      comment.author.professionalProfile?.businessName ||
      comment.author.profile?.displayName ||
      (comment.author.profile?.firstName
        ? `${comment.author.profile.firstName} ${comment.author.profile.lastName ?? ''}`.trim()
        : 'Usuario Yewi');

    const formattedComment = {
      id: comment.id,
      statusId: comment.statusId,
      authorId: comment.authorId,
      authorName: commentAuthorName,
      authorAvatar: comment.author.profile?.avatarUrl || null,
      content: comment.content,
      createdAt: comment.createdAt,
    };

    // 1. Emit realtime comment event to active story viewers
    try {
      this.realtimeService.emitStatusComment({
        statusId,
        comment: formattedComment,
      });
    } catch {}

    // 2. Bridge status comment into 1-on-1 Direct Chat & Stream Chat (WhatsApp/Instagram Story reply standard)
    if (status.authorId !== userId) {
      try {
        let conversation = await this.prisma.conversation.findFirst({
          where: {
            OR: [
              { AND: [{ participantAId: userId }, { participantBId: status.authorId }] },
              { AND: [{ participantAId: status.authorId }, { participantBId: userId }] },
            ],
          },
        });

        if (!conversation) {
          conversation = await this.prisma.conversation.create({
            data: {
              participantAId: userId,
              participantBId: status.authorId,
            },
          });
        }

        const replyContent = `Respondí a tu estado: "${dto.content.trim()}"`;
        const directMessage = await this.prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: userId,
            type: 'TEXT',
            content: replyContent,
            metadata: {
              statusId: status.id,
              statusMediaUrl: status.mediaUrl,
              statusCaption: status.caption,
              isStatusReply: true,
            },
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
          data: { lastMessageAt: new Date() },
        });

        // Realtime emission to both users & the chat room
        this.realtimeService.emitNewChatMessage(
          conversation.id,
          directMessage,
          [userId, status.authorId],
        );

        // Sync with Stream Chat Channel if available
        try {
          const apiKey = process.env.STREAM_API_KEY;
          const apiSecret = process.env.STREAM_API_SECRET;
          if (apiKey && apiSecret) {
            const serverClient = StreamChat.getInstance(apiKey, apiSecret);
            const channelId = `yewi-conv-${conversation.id.replace(/[^a-zA-Z0-9_-]/g, '')}`;

            await serverClient.upsertUsers([
              {
                id: userId,
                name: commentAuthorName,
                image: comment.author.profile?.avatarUrl || undefined,
              },
              {
                id: status.authorId,
                name:
                  status.author.professionalProfile?.businessName ||
                  status.author.profile?.displayName ||
                  'Usuario Yewi',
                image: status.author.profile?.avatarUrl || undefined,
              },
            ]);

            const channel = serverClient.channel('messaging', channelId, {
              members: [userId, status.authorId],
            });
            await channel.create();
            await channel.sendMessage({
              text: replyContent,
              user_id: userId,
              attachments: status.mediaUrl
                ? [
                    {
                      type: 'image',
                      image_url: status.mediaUrl,
                      title: status.caption || 'Estado Yewi',
                    },
                  ]
                : [],
            });
          }
        } catch (streamErr) {
          // Non-blocking stream sync
        }

        // Persist notification and notify status author in realtime
        const notif = await this.prisma.notification.create({
          data: {
            userId: status.authorId,
            type: 'SYSTEM_ALERT',
            title: '💬 Nuevo comentario en tu estado',
            message: `${commentAuthorName}: "${dto.content.length > 60 ? `${dto.content.slice(0, 57)}...` : dto.content}"`,
            link: `/chat?conversationId=${conversation.id}`,
            metadata: {
              conversationId: conversation.id,
              statusId,
              commentId: comment.id,
              authorId: userId,
              messageId: directMessage.id,
            },
          },
        });

        this.realtimeService.emitNotification({
          id: notif.id,
          userId: status.authorId,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          link: notif.link,
          metadata: notif.metadata,
          isRead: notif.isRead,
          createdAt: notif.createdAt,
        });
      } catch (chatBridgeErr) {
        // Silently catch to not block the comment return
      }
    }

    return formattedComment;
  }

  /**
   * Reaccionar / dar like a un estado
   */
  async reactToStatus(userId: string, statusId: string, dto: ReactStatusDto) {
    const status = await this.prisma.status.findUnique({
      where: { id: statusId },
    });

    if (!status) {
      throw new NotFoundException('El estado no existe');
    }

    const reactionType = dto.reactionType || 'LIKE';

    const existing = await this.prisma.statusReaction.findUnique({
      where: {
        statusId_userId: {
          statusId,
          userId,
        },
      },
    });

    let result: { reacted: boolean; reactionType: string | null };

    if (existing) {
      if (existing.reactionType === reactionType) {
        await this.prisma.statusReaction.delete({
          where: { id: existing.id },
        });
        result = { reacted: false, reactionType: null };
      } else {
        const updated = await this.prisma.statusReaction.update({
          where: { id: existing.id },
          data: { reactionType },
        });
        result = { reacted: true, reactionType: updated.reactionType };
      }
    } else {
      const created = await this.prisma.statusReaction.create({
        data: {
          statusId,
          userId,
          reactionType,
        },
      });
      result = { reacted: true, reactionType: created.reactionType };
    }

    // Count updated total reactions for this status
    const totalLikes = await this.prisma.statusReaction.count({
      where: { statusId },
    });

    // 1. Emit realtime reaction event to story viewers
    try {
      this.realtimeService.emitStatusReaction({
        statusId,
        userId,
        reactionType: result.reactionType,
        likesCount: totalLikes,
      });
    } catch {}

    // 2. If new like from another user, create and send notification
    if (result.reacted && status.authorId !== userId) {
      try {
        const reactor = await this.prisma.user.findUnique({
          where: { id: userId },
          include: { profile: true, professionalProfile: true },
        });

        const reactorName =
          reactor?.professionalProfile?.businessName ||
          reactor?.profile?.displayName ||
          (reactor?.profile?.firstName
            ? `${reactor.profile.firstName} ${reactor.profile.lastName ?? ''}`.trim()
            : 'Un usuario');

        const notif = await this.prisma.notification.create({
          data: {
            userId: status.authorId,
            type: 'SYSTEM_ALERT',
            title: '❤️ Reacción a tu estado',
            message: `A ${reactorName} le ha gustado tu estado.`,
            link: `/chat?tab=ESTADOS`,
            metadata: {
              statusId,
              userId,
              reactionType,
            },
          },
        });

        this.realtimeService.emitNotification({
          id: notif.id,
          userId: status.authorId,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          link: notif.link,
          metadata: notif.metadata,
          isRead: notif.isRead,
          createdAt: notif.createdAt,
        });
      } catch {}
    }

    return result;
  }

  /**
   * Eliminar estado propio
   */
  async deleteStatus(userId: string, statusId: string) {
    const status = await this.prisma.status.findUnique({
      where: { id: statusId },
    });

    if (!status) {
      throw new NotFoundException('El estado no existe');
    }

    if (status.authorId !== userId) {
      throw new ForbiddenException('No tienes permiso para eliminar este estado');
    }

    return this.prisma.status.delete({
      where: { id: statusId },
    });
  }
}
