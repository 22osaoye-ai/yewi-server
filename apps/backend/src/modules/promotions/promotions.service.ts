import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeService } from '../../common/realtime/realtime.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';

@Injectable()
export class PromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly realtime?: RealtimeService,
  ) {}

  /**
   * Crear una nueva promoción por tiempo limitado (Solo profesionales)
   */
  async createPromotion(userId: string, dto: CreatePromotionDto) {
    const pro = await this.prisma.professionalProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            profile: true,
          },
        },
      },
    });

    if (!pro) {
      throw new ForbiddenException('Debes tener un perfil profesional para crear promociones');
    }

    const expiresAtDate = new Date(dto.expiresAt);
    if (isNaN(expiresAtDate.getTime()) || expiresAtDate <= new Date()) {
      throw new BadRequestException('La fecha de vencimiento debe ser futura');
    }

    const badge =
      dto.badge ||
      (dto.discountPercent
        ? `-${dto.discountPercent}% DTO`
        : dto.discountAmount
        ? `-${dto.discountAmount}€ DTO`
        : 'OFERTA LIMITADA');

    const promo = await this.prisma.promotion.create({
      data: {
        professionalProfileId: pro.id,
        title: dto.title.trim(),
        description: dto.description.trim(),
        discountPercent: dto.discountPercent,
        discountAmount: dto.discountAmount,
        promoCode: dto.promoCode?.trim().toUpperCase(),
        category: dto.category?.trim(),
        badge,
        expiresAt: expiresAtDate,
        isActive: true,
      },
      include: {
        professionalProfile: {
          include: {
            user: {
              select: {
                id: true,
                profile: true,
              },
            },
          },
        },
      },
    });

    // Notificar a los clientes sobre la nueva promoción del profesional
    try {
      const clients = await this.prisma.user.findMany({
        where: {
          id: { not: userId },
        },
        select: { id: true },
        take: 100,
      });

      if (clients.length > 0) {
        const notifTitle = `🔥 Oferta Limitada: ${dto.title}`;
        const proName =
          pro.businessName ||
          pro.user.profile?.displayName ||
          `${pro.user.profile?.firstName ?? ''} ${pro.user.profile?.lastName ?? ''}`.trim() ||
          'Un profesional';
        const notifMessage = `${proName} ha publicado un descuento (${badge}) en ${
          dto.category || 'servicios'
        }. ¡Válido por tiempo limitado!`;

        await this.prisma.notification.createMany({
          data: clients.map((c) => ({
            userId: c.id,
            type: NotificationType.SYSTEM_ALERT,
            title: notifTitle,
            message: notifMessage,
            link: '/vouchers',
            metadata: {
              promotionId: promo.id,
              professionalId: pro.id,
              category: dto.category,
              discountPercent: dto.discountPercent,
              discountAmount: dto.discountAmount,
              expiresAt: expiresAtDate.toISOString(),
            },
          })),
        });

        clients.forEach((c) => {
          this.realtime?.emitNotification({
            id: null,
            userId: c.id,
            type: NotificationType.SYSTEM_ALERT,
            title: notifTitle,
            message: notifMessage,
            link: '/vouchers',
            metadata: {
              promotionId: promo.id,
              professionalId: pro.id,
              category: dto.category,
              discountPercent: dto.discountPercent,
              discountAmount: dto.discountAmount,
              expiresAt: expiresAtDate.toISOString(),
            },
            isRead: false,
            createdAt: null,
          });
        });
      }
    } catch {
      // Ignorar errores de notificación para no bloquear la creación de la promoción
    }

    return promo;
  }

  /**
   * Obtener todas las promociones activas y vigentes
   */
  async getActivePromotions(category?: string) {
    const where: any = {
      isActive: true,
      expiresAt: { gt: new Date() },
    };

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    const promotions = await this.prisma.promotion.findMany({
      where,
      include: {
        professionalProfile: {
          include: {
            user: {
              select: {
                id: true,
                profile: {
                  select: {
                    displayName: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                    city: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return promotions.map((promo) => ({
      id: promo.id,
      title: promo.title,
      description: promo.description,
      discountPercent: promo.discountPercent,
      discountAmount: promo.discountAmount ? Number(promo.discountAmount) : null,
      promoCode: promo.promoCode,
      category: promo.category || 'General',
      badge: promo.badge || 'PROMO',
      expiresAt: promo.expiresAt,
      createdAt: promo.createdAt,
      professional: {
        id: promo.professionalProfile.id,
        userId: promo.professionalProfile.userId,
        name:
          promo.professionalProfile.businessName ||
          promo.professionalProfile.user.profile?.displayName ||
          `${promo.professionalProfile.user.profile?.firstName ?? ''} ${promo.professionalProfile.user.profile?.lastName ?? ''}`.trim() ||
          'Profesional Yewi',
        avatarUrl: promo.professionalProfile.user.profile?.avatarUrl,
        city: promo.professionalProfile.city || promo.professionalProfile.user.profile?.city || 'Zaragoza',
        avgRating: promo.professionalProfile.avgRating,
        totalReviews: promo.professionalProfile.totalReviews,
        isPro: promo.professionalProfile.isPro,
      },
    }));
  }

  /**
   * Obtener las promociones del profesional autenticado
   */
  async getMyPromotions(userId: string) {
    const pro = await this.prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (!pro) {
      throw new ForbiddenException('Debes tener un perfil profesional');
    }

    return this.prisma.promotion.findMany({
      where: { professionalProfileId: pro.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Eliminar o desactivar una promoción propia
   */
  async deletePromotion(userId: string, promotionId: string) {
    const pro = await this.prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (!pro) {
      throw new ForbiddenException('Debes tener un perfil profesional');
    }

    const promo = await this.prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promo) {
      throw new NotFoundException('Promoción no encontrada');
    }

    if (promo.professionalProfileId !== pro.id) {
      throw new ForbiddenException('No tienes permiso para eliminar esta promoción');
    }

    await this.prisma.promotion.delete({
      where: { id: promotionId },
    });

    return { success: true, message: 'Promoción eliminada correctamente' };
  }
}
