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
  CancelOrderDto,
  CreateGigOrderDto,
  OpenDisputeDto,
  RequestRevisionDto,
  SubmitDeliveryDto,
  SubmitRequirementsDto,
} from './dto/create-gig-order.dto';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
    @Optional() private readonly realtime?: RealtimeService,
  ) {}

  /**
   * Crear un nuevo pedido a partir de un paquete de Gig (Fiverr Style)
   */
  async createGigOrder(userId: string, dto: CreateGigOrderDto) {
    let pkg = await this.prisma.gigPackage.findUnique({
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

    if (!pkg) {
      pkg = await this.prisma.gigPackage.findFirst({
        where: {
          OR: [
            { id: dto.gigPackageId },
            { gigId: dto.gigPackageId },
            { gig: { slug: dto.gigPackageId } },
            ...(dto.gigId ? [{ gigId: dto.gigId }] : []),
          ],
        },
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
    }

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

    let clientWallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!clientWallet) {
      clientWallet = await this.prisma.wallet.create({
        data: {
          userId,
          creditBalance: 0,
          fiatAvailableBalance: 0,
          fiatPendingBalance: 0,
        },
      });
    }

    const availableBalance = Number(clientWallet.fiatAvailableBalance);

    if (availableBalance < totalAmount) {
      throw new BadRequestException(
        `Saldo insuficiente en tu billetera (${availableBalance.toFixed(2)} €) para cubrir este pedido (${totalAmount.toFixed(2)} €). Paga con tarjeta mediante Stripe o recarga tu saldo antes de continuar.`,
      );
    }

    const orderNumber = `ORD-GIG-${Date.now().toString().slice(-6)}`;
    const hasRequirements =
      !!dto.requirementsAnswers &&
      Object.keys(dto.requirementsAnswers).length > 0;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Debitar fondos reales de la billetera del cliente hacia Escrow
      await tx.wallet.update({
        where: { id: clientWallet.id },
        data: {
          fiatAvailableBalance: { decrement: totalAmount },
        },
      });

      // 2. Registrar transacción en el libro mayor
      await tx.ledgerTransaction.create({
        data: {
          walletId: clientWallet.id,
          type: TransactionType.ORDER_PAYMENT,
          amount: -totalAmount,
          currency: 'EUR',
          status: TransactionStatus.COMPLETED,
          metadata: {
            orderNumber,
            action: 'WALLET_ESCROW_DEPOSIT',
          },
        },
      });

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
   * Iniciar sesión de Stripe Checkout para pagar y crear un encargo con custodia Escrow
   */
  async createGigCheckoutSession(userId: string, dto: CreateGigOrderDto) {
    let pkg = await this.prisma.gigPackage.findUnique({
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

    if (!pkg) {
      pkg = await this.prisma.gigPackage.findFirst({
        where: {
          OR: [
            { id: dto.gigPackageId },
            { gigId: dto.gigPackageId },
            { gig: { slug: dto.gigPackageId } },
            ...(dto.gigId ? [{ gigId: dto.gigId }] : []),
          ],
        },
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
    }

    if (!pkg || !pkg.gig) {
      throw new NotFoundException('Paquete de servicio no encontrado');
    }

    if (pkg.gig.professionalProfile.userId === userId) {
      throw new BadRequestException('No puedes comprar tu propio servicio');
    }

    let subtotal = Number(pkg.price);

    if (dto.extraIds && dto.extraIds.length > 0) {
      const extras = await this.prisma.gigExtra.findMany({
        where: { id: { in: dto.extraIds }, gigId: pkg.gigId },
      });
      for (const ext of extras) {
        subtotal += Number(ext.price);
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    return this.paymentsService.createGigOrderCheckoutSession({
      userId,
      userEmail: user?.email,
      title: pkg.gig.title,
      packageName: pkg.name,
      amount: subtotal,
      gigPackageId: pkg.id,
      extraIds: dto.extraIds,
      requirementsAnswers: dto.requirementsAnswers,
    });
  }

  /**
   * Confirmar sesión de Stripe Checkout y materializar la orden con fondos reales en Escrow
   */
  async confirmGigCheckoutSession(userId: string, sessionId: string) {
    const session =
      await this.paymentsService.retrieveCheckoutSession(sessionId);

    if (!session) {
      throw new NotFoundException('Sesión de pago no encontrada en Stripe');
    }

    if (session.payment_status !== 'paid') {
      throw new BadRequestException(
        'El pago en la pasarela de Stripe no ha sido completado.',
      );
    }

    if (session.metadata?.userId !== userId) {
      throw new ForbiddenException(
        'Esta sesión de pago no corresponde a tu usuario.',
      );
    }

    const gigPackageId = session.metadata?.gigPackageId;
    if (!gigPackageId) {
      throw new BadRequestException('Metadata de sesión de Stripe inválida');
    }

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent as any)?.id;

    // Idempotencia: Verificar si ya existe una orden creada con esta sesión o PaymentIntent
    const existingLedger = await this.prisma.ledgerTransaction.findFirst({
      where: {
        OR: [
          ...(paymentIntentId
            ? [{ stripePaymentIntentId: paymentIntentId }]
            : []),
          {
            metadata: {
              path: ['sessionId'],
              equals: sessionId,
            },
          },
        ],
      },
    });

    if (existingLedger?.referenceId) {
      const existingOrder = await this.prisma.order.findUnique({
        where: { id: existingLedger.referenceId },
        include: {
          gig: true,
          gigPackage: true,
          professionalProfile: {
            include: { user: true },
          },
        },
      });
      if (existingOrder) {
        return existingOrder;
      }
    }

    const pkg = await this.prisma.gigPackage.findUnique({
      where: { id: gigPackageId },
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

    let extraIds: string[] = [];
    try {
      if (session.metadata?.extraIds) {
        extraIds = JSON.parse(session.metadata.extraIds);
      }
    } catch {}

    let requirementsAnswers: Record<string, any> = {};
    try {
      if (session.metadata?.requirementsAnswers) {
        requirementsAnswers = JSON.parse(session.metadata.requirementsAnswers);
      }
    } catch {}

    let subtotal = Number(pkg.price);
    let totalDays = pkg.deliveryDays;

    if (extraIds.length > 0) {
      const extras = await this.prisma.gigExtra.findMany({
        where: { id: { in: extraIds }, gigId: pkg.gigId },
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

    let clientWallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!clientWallet) {
      clientWallet = await this.prisma.wallet.create({
        data: {
          userId,
          creditBalance: 0,
          fiatAvailableBalance: 0,
          fiatPendingBalance: 0,
        },
      });
    }

    const orderNumber = `ORD-GIG-${Date.now().toString().slice(-6)}`;
    const hasRequirements =
      !!requirementsAnswers && Object.keys(requirementsAnswers).length > 0;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Registrar transacción en el libro mayor con el ID de Stripe real
      const ledgerTx = await tx.ledgerTransaction.create({
        data: {
          walletId: clientWallet.id,
          type: TransactionType.ORDER_PAYMENT,
          amount: -totalAmount,
          currency: 'EUR',
          status: TransactionStatus.COMPLETED,
          stripePaymentIntentId: paymentIntentId ?? null,
          metadata: {
            orderNumber,
            sessionId,
            stripePaymentIntentId: paymentIntentId ?? null,
            action: 'STRIPE_ESCROW_DEPOSIT',
          },
        },
      });

      // 2. Crear orden con fondos retenidos en Escrow
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
          requirementsAnswers,
          deliveryDeadline,
        },
        include: {
          gig: true,
          gigPackage: true,
          professionalProfile: {
            include: { user: true },
          },
        },
      });

      // 3. Vincular orderId a la transacción del ledger
      await tx.ledgerTransaction.update({
        where: { id: ledgerTx.id },
        data: { referenceId: order.id },
      });

      // 4. Crear conversación vinculada al pedido
      await tx.conversation.create({
        data: {
          orderId: order.id,
          participantAId: userId,
          participantBId: pkg.gig.professionalProfile.userId,
        },
      });

      // 5. Notificar al profesional
      const notification = await tx.notification.create({
        data: {
          userId: pkg.gig.professionalProfile.userId,
          type: NotificationType.ORDER_CREATED,
          title: '¡Tienes un nuevo pedido pagado!',
          message: `Has recibido un nuevo pedido de ${totalAmount} € para tu servicio "${pkg.gig.title}". Fondos retenidos en Escrow.`,
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

  /**
   * Cancelar un pedido activo y devolver el 100% del saldo de Escrow a la billetera del cliente
   */
  async cancelOrder(userId: string, orderId: string, dto?: CancelOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: {
          include: { wallet: true },
        },
        professionalProfile: {
          include: { user: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    const isClient = order.clientId === userId;
    const isPro = order.professionalProfile?.user?.id === userId;

    if (!isClient && !isPro) {
      throw new ForbiddenException(
        'No estás autorizado para cancelar este pedido',
      );
    }

    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException(
        'No se puede cancelar un pedido completado con fondos ya liberados',
      );
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('El pedido ya ha sido cancelado previamente');
    }

    const refundAmount = Number(order.totalAmount);
    const reasonText = dto?.reason?.trim() || 'Cancelación de pedido no realizado';

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Marcar pedido como cancelado y Escrow reembolsado al cliente
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          escrowStatus: EscrowStatus.REFUNDED_TO_CLIENT,
        },
      });

      // 2. Acreditar reembolso en la billetera del cliente
      if (order.client.wallet && refundAmount > 0) {
        await tx.wallet.update({
          where: { id: order.client.wallet.id },
          data: {
            fiatAvailableBalance: { increment: refundAmount },
          },
        });

        // 3. Registrar transacción de reembolso en el libro mayor
        await tx.ledgerTransaction.create({
          data: {
            walletId: order.client.wallet.id,
            type: TransactionType.ORDER_REFUND,
            amount: refundAmount,
            currency: 'EUR',
            status: TransactionStatus.COMPLETED,
            referenceId: order.id,
            metadata: {
              orderNumber: order.orderNumber,
              action: 'ESCROW_REFUND',
              reason: reasonText,
              cancelledBy: isClient ? 'CLIENT' : 'PRO',
            },
          },
        });
      }

      // 4. Notificaciones para ambas partes
      const clientNotification = await tx.notification.create({
        data: {
          userId: order.clientId,
          type: NotificationType.SYSTEM_ALERT,
          title: 'Pedido cancelado y reembolsado',
          message: `El pedido ${order.orderNumber} ha sido cancelado. Se han acreditado ${refundAmount.toFixed(2)} € a tu billetera.`,
          link: `/orders/${order.id}`,
        },
      });

      let proNotification: any = null;
      if (order.professionalProfile?.user?.id) {
        proNotification = await tx.notification.create({
          data: {
            userId: order.professionalProfile.user.id,
            type: NotificationType.SYSTEM_ALERT,
            title: 'Pedido cancelado',
            message: `El pedido ${order.orderNumber} ha sido cancelado. Motivo: ${reasonText}.`,
            link: `/orders/${order.id}`,
          },
        });
      }

      return { updatedOrder, clientNotification, proNotification };
    });

    this.realtime?.emitNotification(result.clientNotification);
    if (result.proNotification) {
      this.realtime?.emitNotification(result.proNotification);
    }

    return result.updatedOrder;
  }
}
