import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateReviewDto, ReplyReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear reseña verificada para un pedido completado
   */
  async createReview(userId: string, dto: CreateReviewDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        professionalProfile: true,
        review: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (order.clientId !== userId) {
      throw new ForbiddenException(
        'Solo el comprador puede dejar una reseña sobre el pedido',
      );
    }

    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException(
        'Solo se pueden valorar pedidos que hayan sido completados',
      );
    }

    if (order.review) {
      throw new ConflictException('Ya has valorado este pedido');
    }

    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          orderId: order.id,
          gigId: order.gigId,
          authorId: userId,
          targetUserId: order.professionalProfile.userId,
          rating: dto.rating,
          qualityRating: dto.qualityRating,
          communicationRating: dto.communicationRating,
          deliveryRating: dto.deliveryRating,
          comment: dto.comment,
        },
      });

      // Recalcular métricas del profesional
      const proReviews = await tx.review.findMany({
        where: { targetUserId: order.professionalProfile.userId },
        select: { rating: true },
      });

      const totalReviews = proReviews.length;
      const avgRating =
        Math.round(
          (proReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) *
            10,
        ) / 10;

      await tx.professionalProfile.update({
        where: { id: order.professionalProfileId },
        data: {
          avgRating,
          totalReviews,
        },
      });

      // Si el pedido pertenecía a un Gig, recalcular rating del Gig
      if (order.gigId) {
        const gigReviews = await tx.review.findMany({
          where: { gigId: order.gigId },
          select: { rating: true },
        });

        const gigAvgRating =
          Math.round(
            (gigReviews.reduce((sum, r) => sum + r.rating, 0) /
              gigReviews.length) *
              10,
          ) / 10;

        await tx.gig.update({
          where: { id: order.gigId },
          data: {
            avgRating: gigAvgRating,
            totalReviews: gigReviews.length,
          },
        });
      }

      return review;
    });
  }

  /**
   * Respuesta pública del vendedor a una reseña
   */
  async replyToReview(userId: string, reviewId: string, dto: ReplyReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Reseña no encontrada');
    }

    if (review.targetUserId !== userId) {
      throw new ForbiddenException(
        'Solo el profesional valorado puede responder a esta reseña',
      );
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        sellerReply: dto.reply,
        sellerRepliedAt: new Date(),
      },
    });
  }

  /**
   * Obtener reseñas de un profesional
   */
  async getReviewsByTargetUser(targetUserId: string) {
    return this.prisma.review.findMany({
      where: { targetUserId },
      include: {
        author: {
          select: {
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
