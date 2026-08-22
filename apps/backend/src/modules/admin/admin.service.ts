import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EscrowStatus,
  KycStatus,
  NotificationType,
  OrderStatus,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ResolveDisputeDto, ReviewKycDto } from './dto/review-kyc.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Métricas y estadísticas generales de la plataforma (GMV, ingresos, usuarios)
   */
  async getDashboardStats() {
    const [
      totalUsers,
      totalPros,
      totalGigs,
      totalRequests,
      completedOrders,
      activeOrders,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.professionalProfile.count(),
      this.prisma.gig.count({ where: { deletedAt: null } }),
      this.prisma.serviceRequest.count(),
      this.prisma.order.findMany({
        where: { status: OrderStatus.COMPLETED },
        select: { totalAmount: true, platformFee: true },
      }),
      this.prisma.order.count({
        where: {
          status: {
            in: [
              OrderStatus.IN_PROGRESS,
              OrderStatus.DELIVERED,
              OrderStatus.REVISION_REQUESTED,
              OrderStatus.PENDING_REQUIREMENTS,
            ],
          },
        },
      }),
    ]);

    const gmv = completedOrders.reduce(
      (sum, o) => sum + Number(o.totalAmount),
      0,
    );
    const totalPlatformRevenue = completedOrders.reduce(
      (sum, o) => sum + Number(o.platformFee),
      0,
    );

    return {
      overview: {
        totalUsers,
        totalProfessionals: totalPros,
        totalActiveGigs: totalGigs,
        totalServiceRequests: totalRequests,
        activeOrdersCount: activeOrders,
        completedOrdersCount: completedOrders.length,
        gmv: Math.round(gmv * 100) / 100,
        totalPlatformRevenue: Math.round(totalPlatformRevenue * 100) / 100,
      },
    };
  }

  /**
   * Listar solicitudes de verificación KYC pendientes
   */
  async getPendingKyc() {
    return this.prisma.professionalProfile.findMany({
      where: { kycStatus: KycStatus.PENDING_REVIEW },
      include: {
        user: {
          select: {
            email: true,
            profile: true,
          },
        },
      },
      orderBy: { updatedAt: 'asc' },
    });
  }

  /**
   * Revisar y aprobar/rechazar KYC de un profesional
   */
  async reviewKyc(proId: string, dto: ReviewKycDto) {
    const pro = await this.prisma.professionalProfile.findUnique({
      where: { id: proId },
      include: { user: true },
    });

    if (!pro) {
      throw new NotFoundException('Perfil profesional no encontrado');
    }

    const updated = await this.prisma.professionalProfile.update({
      where: { id: proId },
      data: {
        kycStatus: dto.status,
        kycRejectionReason:
          dto.status === KycStatus.REJECTED ? dto.rejectionReason : null,
        badges: dto.badges ? { set: dto.badges } : undefined,
      },
    });

    // Notificar al profesional
    await this.prisma.notification.create({
      data: {
        userId: pro.userId,
        type: NotificationType.SYSTEM_ALERT,
        title:
          dto.status === KycStatus.VERIFIED
            ? '¡Tu perfil profesional ha sido verificado!'
            : 'Tu solicitud de verificación KYC ha sido rechazada',
        message:
          dto.status === KycStatus.VERIFIED
            ? 'Tu documento ha sido aprobado. Ahora cuentas con el distintivo de Profesional Verificado.'
            : `Motivo del rechazo: ${dto.rejectionReason ?? 'Documentación incompleta.'}`,
      },
    });

    return updated;
  }

  /**
   * Listar disputas abiertas
   */
  async getDisputes() {
    return this.prisma.orderDispute.findMany({
      include: {
        order: {
          include: {
            client: { select: { email: true, profile: true } },
            professionalProfile: {
              include: {
                user: { select: { email: true, profile: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Arbitrar y resolver disputa con distribución de fondos de Escrow
   */
  async resolveDispute(
    adminUserId: string,
    disputeId: string,
    dto: ResolveDisputeDto,
  ) {
    const dispute = await this.prisma.orderDispute.findUnique({
      where: { id: disputeId },
      include: {
        order: {
          include: {
            client: { include: { wallet: true } },
            professionalProfile: {
              include: { user: { include: { wallet: true } } },
            },
          },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Disputa no encontrada');
    }

    if (dispute.status !== 'OPEN') {
      throw new BadRequestException('Esta disputa ya ha sido resuelta');
    }

    const order = dispute.order;
    const totalOrderAmount = Number(order.totalAmount);

    if (dto.refundAmountClient + dto.payoutAmountPro > totalOrderAmount) {
      throw new BadRequestException(
        `La suma a reembolsar y pagar (${dto.refundAmountClient + dto.payoutAmountPro} €) no puede exceder el total del pedido (${totalOrderAmount} €)`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Actualizar disputa
      const resolvedDispute = await tx.orderDispute.update({
        where: { id: disputeId },
        data: {
          status: 'RESOLVED',
          resolvedByAdminId: adminUserId,
          resolutionNotes: dto.resolutionNotes,
          refundAmountClient: dto.refundAmountClient,
          payoutAmountPro: dto.payoutAmountPro,
          resolvedAt: new Date(),
        },
      });

      // 2. Actualizar estado del pedido y escrow
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.COMPLETED,
          escrowStatus:
            dto.refundAmountClient > 0
              ? EscrowStatus.PARTIALLY_REFUNDED
              : EscrowStatus.RELEASED_TO_PRO,
        },
      });

      // 3. Acreditar reembolso al cliente si aplica
      if (dto.refundAmountClient > 0 && order.client.wallet) {
        await tx.wallet.update({
          where: { id: order.client.wallet.id },
          data: {
            fiatAvailableBalance: { increment: dto.refundAmountClient },
          },
        });

        await tx.ledgerTransaction.create({
          data: {
            walletId: order.client.wallet.id,
            type: TransactionType.ORDER_REFUND,
            amount: dto.refundAmountClient,
            currency: 'EUR',
            status: TransactionStatus.COMPLETED,
            referenceId: order.id,
          },
        });
      }

      // 4. Acreditar pago al profesional si aplica
      if (dto.payoutAmountPro > 0 && order.professionalProfile.user.wallet) {
        await tx.wallet.update({
          where: { id: order.professionalProfile.user.wallet.id },
          data: {
            fiatAvailableBalance: { increment: dto.payoutAmountPro },
          },
        });

        await tx.ledgerTransaction.create({
          data: {
            walletId: order.professionalProfile.user.wallet.id,
            type: TransactionType.ESCROW_RELEASE,
            amount: dto.payoutAmountPro,
            currency: 'EUR',
            status: TransactionStatus.COMPLETED,
            referenceId: order.id,
          },
        });
      }

      // 5. Notificar a ambas partes
      await tx.notification.createMany({
        data: [
          {
            userId: order.clientId,
            type: NotificationType.DISPUTE_OPENED,
            title: 'Disputa resuelta por administración',
            message: `Resolución del pedido ${order.orderNumber}: Reembolso de ${dto.refundAmountClient} €. Nota: ${dto.resolutionNotes}`,
            link: `/orders/${order.id}`,
          },
          {
            userId: order.professionalProfile.user.id,
            type: NotificationType.DISPUTE_OPENED,
            title: 'Disputa resuelta por administración',
            message: `Resolución del pedido ${order.orderNumber}: Pago de ${dto.payoutAmountPro} €. Nota: ${dto.resolutionNotes}`,
            link: `/orders/${order.id}`,
          },
        ],
      });

      return resolvedDispute;
    });
  }
}
