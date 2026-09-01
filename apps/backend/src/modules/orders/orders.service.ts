import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  EscrowStatus,
  NotificationType,
  OrderStatus,
  OrderType,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeService } from '../../common/realtime/realtime.service';
import {
  CreateGigOrderDto,
  OpenDisputeDto,
  RequestRevisionDto,
  SubmitDeliveryDto,
  SubmitRequirementsDto,
} from './dto/create-gig-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly realtime?: RealtimeService,
  ) {}

  /**
   * Crear un nuevo pedido a partir de un paquete de Gig (Fiverr Style)
   */
  async createGigOrder(userId: string, dto: CreateGigOrderDto) {
    const pkg = await this.prisma.gigPackage.findUnique({
      where: { id: dto.gigPackageId },
      include: {
        gig: {
          include: {
            professionalProfile: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!pkg || !pkg.gig) {
      throw new NotFoundException('Paquete de servicio no encontrado');
    }

    if (pkg.gig.professionalProfile.userId === userId) {
      throw new BadRequestException('No puedes comprar tu propio servicio');
    }

    let subtotal = Number(pkg.price);
    let totalDays = pkg.deliveryDays;

    // Sumar extras si se seleccionaron
    if (dto.extraIds && dto.extraIds.length > 0) {
      const extras = await this.prisma.gigExtra.findMany({
        where: { id: { in: dto.extraIds }, gigId: pkg.gigId },
      });

      for (const ext of extras) {
        subtotal += Number(ext.price);
        totalDays += ext.additionalDeliveryDays;
      }
    }

    const platformCommissionPercent = 15;
    const platformFee =
      Math.round(subtotal * (platformCommissionPercent / 100) * 100) / 100;
    const proEarnings = Math.round((subtotal - platformFee) * 100) / 100;
    const totalAmount = subtotal;

    const deliveryDeadline = new Date();
    deliveryDeadline.setDate(
      deliveryDeadline.getDate() + Math.max(1, totalDays),
    );

    const orderNumber = `ORD-GIG-${Date.now().toString().slice(-6)}`;
    const hasRequirements =
      !!dto.requirementsAnswers &&
      Object.keys(dto.requirementsAnswers).length > 0;

    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          clientId: userId,
          professionalProfileId: pkg.gig.professionalProfileId,
          orderType: OrderType.GIG_PURCHASE,
          gigId: pkg.gigId,
          gigPackageId: pkg.id,
          status: hasRequirements
            ? OrderStatus.IN_PROGRESS
            : OrderStatus.PENDING_REQUIREMENTS,
          subtotal,
          platformFee,
          totalAmount,
          proEarnings,
          escrowStatus: EscrowStatus.HELD,
          requirementsAnswers: dto.requirementsAnswers,
          deliveryDeadline,
        },
      });

      // Crear conversación vinculada al pedido
      await tx.conversation.create({
        data: {
          orderId: order.id,
          participantAId: userId,
          participantBId: pkg.gig.professionalProfile.userId,
        },
      });

      // Notificar al profesional
      const notification = await tx.notification.create({
        data: {
          userId: pkg.gig.professionalProfile.userId,
          type: NotificationType.ORDER_CREATED,
          title: '¡Tienes un nuevo pedido!',
          message: `Has recibido un nuevo pedido de ${totalAmount} € para tu servicio "${pkg.gig.title}".`,
          link: `/orders/${order.id}`,
        },
      });

      return { order, notification };
    });
    this.realtime?.emitNotification(result.notification);
    return result.order;
  }

  /**
   * Enviar respuestas a los requerimientos iniciales
   */
  async submitRequirements(
    userId: string,
    orderId: string,
    dto: SubmitRequirementsDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.clientId !== userId) {
      throw new ForbiddenException('Pedido no encontrado o no autorizado');
    }

    if (order.status !== OrderStatus.PENDING_REQUIREMENTS) {
      throw new BadRequestException('Los requerimientos ya han sido enviados');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        requirementsAnswers: dto.requirementsAnswers,
        status: OrderStatus.IN_PROGRESS,
      },
    });
  }

  /**
   * Entregar el trabajo completado (Profesional)
   */
  async submitDelivery(
    userId: string,
    orderId: string,
    dto: SubmitDeliveryDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        professionalProfile: true,
        deliveries: true,
      },
    });

    if (!order || order.professionalProfile.userId !== userId) {
      throw new ForbiddenException(
        'Solo el profesional asignado puede realizar entregas',
      );
    }

    if (
      order.status !== OrderStatus.IN_PROGRESS &&
      order.status !== OrderStatus.REVISION_REQUESTED
    ) {
      throw new BadRequestException(
        'El pedido no está en estado activo para recibir entregas',
      );
    }

    const deliveryNumber = order.deliveries.length + 1;

    const result = await this.prisma.$transaction(async (tx) => {
      const delivery = await tx.orderDelivery.create({
        data: {
          orderId,
          deliveryNumber,
          message: dto.message,
          attachmentUrls: dto.attachmentUrls,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.DELIVERED },
      });

      // Notificar al cliente
      const notification = await tx.notification.create({
        data: {
          userId: order.clientId,
          type: NotificationType.ORDER_DELIVERED,
          title: '¡Entrega de trabajo recibida!',
          message: `El profesional ha enviado la entrega #${deliveryNumber} para el pedido ${order.orderNumber}. Revisa los archivos y aprueba o solicita revisión.`,
          link: `/orders/${order.id}`,
        },
      });

      return { delivery, notification };
    });
    this.realtime?.emitNotification(result.notification);
    return result.delivery;
  }

  /**
   * Solicitar revisión sobre una entrega (Cliente)
   */
  async requestRevision(
    userId: string,
    orderId: string,
    dto: RequestRevisionDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { professionalProfile: true },
    });

    if (!order || order.clientId !== userId) {
      throw new ForbiddenException(
        'Solo el comprador puede solicitar revisiones',
      );
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException(
        'Solo puedes solicitar revisión de un trabajo entregado',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.REVISION_REQUESTED },
      });

      const notification = await tx.notification.create({
        data: {
          userId: order.professionalProfile.userId,
          type: NotificationType.REVISION_REQUESTED,
          title: 'El cliente ha solicitado una revisión',
          message: `Revisión solicitada para ${order.orderNumber}: "${dto.revisionNotes}"`,
          link: `/orders/${order.id}`,
        },
      });

      return {
        response: { message: 'Solicitud de revisión enviada al profesional' },
        notification,
      };
    });
    this.realtime?.emitNotification(result.notification);
    return result.response;
  }

  /**
   * Aprobar entrega final y liberar fondos del Escrow al profesional (Cliente)
   */
  async approveDelivery(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        professionalProfile: {
          include: {
            user: {
              include: { wallet: true },
            },
          },
        },
      },
    });

    if (!order || order.clientId !== userId) {
      throw new ForbiddenException(
        'Solo el comprador puede aprobar la entrega',
      );
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException(
        'El pedido debe estar en estado ENTREGADO para ser completado',
      );
    }

    const proUser = order.professionalProfile.user;
    const earnings = Number(order.proEarnings);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Marcar pedido como completado y Escrow liberado
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.COMPLETED,
          escrowStatus: EscrowStatus.RELEASED_TO_PRO,
          autoCompletedAt: new Date(),
        },
      });

      // 2. Incrementar saldo fiat en la billetera del profesional
      if (proUser.wallet) {
        await tx.wallet.update({
          where: { id: proUser.wallet.id },
          data: {
            fiatAvailableBalance: { increment: earnings },
          },
        });

        // 3. Registrar transacción de liberación en el libro mayor
        await tx.ledgerTransaction.create({
          data: {
            walletId: proUser.wallet.id,
            type: TransactionType.ESCROW_RELEASE,
            amount: earnings,
            currency: 'EUR',
            status: TransactionStatus.COMPLETED,
            referenceId: order.id,
            metadata: {
              orderNumber: order.orderNumber,
              totalAmount: Number(order.totalAmount),
              platformFee: Number(order.platformFee),
            },
          },
        });
      }

      // 4. Actualizar métricas del profesional
      await tx.professionalProfile.update({
        where: { id: order.professionalProfileId },
        data: {
          completedOrdersCount: { increment: 1 },
        },
      });

      // 5. Si fue compra de Gig, actualizar contador del gig
      if (order.gigId) {
        await tx.gig.update({
          where: { id: order.gigId },
          data: {
            ordersCount: { increment: 1 },
          },
        });
      }

      // 6. Notificar al profesional
      const notification = await tx.notification.create({
        data: {
          userId: proUser.id,
          type: NotificationType.ORDER_COMPLETED,
          title: '¡Pedido aprobado y fondos liberados!',
          message: `El cliente ha completado el pedido ${order.orderNumber}. Se han acreditado ${earnings} € a tu saldo disponible.`,
          link: `/orders/${order.id}`,
        },
      });

      return { updatedOrder, notification };
    });
    this.realtime?.emitNotification(result.notification);
    return result.updatedOrder;
  }

  /**
   * Abrir una disputa (Centro de resolución)
   */
  async openDispute(userId: string, orderId: string, dto: OpenDisputeDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { professionalProfile: true },
    });

    if (
      !order ||
      (order.clientId !== userId && order.professionalProfile.userId !== userId)
    ) {
      throw new ForbiddenException('No tienes acceso a este pedido');
    }

    return this.prisma.$transaction(async (tx) => {
      const dispute = await tx.orderDispute.create({
        data: {
          orderId,
          initiatorId: userId,
          reason: dto.reason,
          description: dto.description,
          evidenceUrls: dto.evidenceUrls ?? [],
          status: 'OPEN',
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.DISPUTED },
      });

      return dispute;
    });
  }

  /**
   * Obtener detalle completo de un pedido
   */
  async getOrderById(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
        professionalProfile: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profile: true,
              },
            },
          },
        },
        gig: true,
        gigPackage: true,
        quoteProposal: true,
        serviceRequest: true,
        deliveries: {
          orderBy: { createdAt: 'desc' },
        },
        milestones: true,
        dispute: true,
        review: true,
        conversation: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (
      order.clientId !== userId &&
      order.professionalProfile.user.id !== userId
    ) {
      throw new ForbiddenException('No estás autorizado para ver este pedido');
    }

    return order;
  }

  /**
   * Listar mis pedidos (como comprador o como vendedor)
   */
  async getMyOrders(userId: string, role?: 'client' | 'pro') {
    const pro = await this.prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (role === 'pro') {
      if (!pro) return [];
      return this.prisma.order.findMany({
        where: { professionalProfileId: pro.id },
        include: {
          client: { select: { profile: true } },
          gig: { select: { title: true, coverImages: true } },
          serviceRequest: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.order.findMany({
      where: { clientId: userId },
      include: {
        professionalProfile: {
          include: { user: { select: { profile: true } } },
        },
        gig: { select: { title: true, coverImages: true } },
        serviceRequest: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
