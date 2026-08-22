import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  EscrowStatus,
  LeadStatus,
  NotificationType,
  OrderStatus,
  OrderType,
  Prisma,
  ProposalStatus,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { GeoUtils } from '../../common/utils/geo.utils';
import { PrismaService } from '../../database/prisma.service';
import { CreateQuoteProposalDto } from './dto/create-quote-proposal.dto';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { FilterLeadsDto } from './dto/filter-leads.dto';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear una solicitud de servicio (Cliente - ProntoPro Style)
   */
  async createRequest(userId: string, dto: CreateServiceRequestDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    // Calcular costo en créditos (base + recargo si es urgente)
    const baseCost = category.baseLeadCreditCost ?? 10;
    const creditCost = dto.isUrgent ? Math.round(baseCost * 1.5) : baseCost;

    // Expiración por defecto a 14 días
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    return this.prisma.serviceRequest.create({
      data: {
        clientId: userId,
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description,
        questionnaireAnswers: dto.questionnaireAnswers,
        budgetMin: dto.budgetMin,
        budgetMax: dto.budgetMax,
        isUrgent: dto.isUrgent ?? false,
        preferredDate: dto.preferredDate ? new Date(dto.preferredDate) : null,
        postalCode: dto.postalCode,
        city: dto.city,
        country: dto.country ?? 'ES',
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        isRemote: dto.isRemote ?? false,
        creditCost,
        maxUnlocks: 5,
        unlocksCount: 0,
        status: LeadStatus.OPEN,
        expiresAt,
      },
      include: {
        category: true,
      },
    });
  }

  /**
   * Listar oportunidades de negocio para un profesional con cálculo de radio y estado de desbloqueo
   */
  async findOpportunitiesForPro(userId: string, filter: FilterLeadsDto) {
    const pro = await this.prisma.professionalProfile.findUnique({
      where: { userId },
      include: { categories: true },
    });

    if (!pro) {
      throw new ForbiddenException('Debes tener un perfil profesional');
    }

    const where: Prisma.ServiceRequestWhereInput = {
      status: LeadStatus.OPEN,
      expiresAt: { gt: new Date() },
    };

    if (filter.categoryId) {
      where.categoryId = filter.categoryId;
    }

    if (filter.city) {
      where.city = { contains: filter.city, mode: 'insensitive' };
    }

    if (filter.isUrgent !== undefined) {
      where.isUrgent = filter.isUrgent;
    }

    const requests = await this.prisma.serviceRequest.findMany({
      where,
      include: {
        category: true,
        unlocks: {
          where: { professionalProfileId: pro.id },
        },
        client: {
          select: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
                phoneNumber: true,
              },
            },
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Procesar cada oportunidad: calcular distancia y enmascarar datos si no está desbloqueado
    const formatted = requests.map((req) => {
      const isUnlocked = req.unlocks.length > 0;
      let distanceKm: number | null = null;

      if (pro.latitude && pro.longitude && req.latitude && req.longitude) {
        distanceKm = GeoUtils.calculateHaversineDistance(
          pro.latitude,
          pro.longitude,
          req.latitude,
          req.longitude,
        );
      }

      const isWithinProRadius =
        distanceKm !== null ? distanceKm <= pro.serviceRadiusKm : true;

      // Si no ha sido desbloqueado por este pro, ocultar datos sensibles
      return {
        id: req.id,
        title: req.title,
        description: req.description,
        category: req.category,
        budgetMin: req.budgetMin,
        budgetMax: req.budgetMax,
        isUrgent: req.isUrgent,
        postalCode: req.postalCode,
        city: req.city,
        creditCost: req.creditCost,
        unlocksCount: req.unlocksCount,
        maxUnlocks: req.maxUnlocks,
        remainingUnlocks: Math.max(0, req.maxUnlocks - req.unlocksCount),
        distanceKm,
        isWithinProRadius,
        isUnlockedByMe: isUnlocked,
        createdAt: req.createdAt,
        expiresAt: req.expiresAt,
        client: isUnlocked
          ? {
              name: `${req.client.profile?.firstName} ${req.client.profile?.lastName}`,
              email: req.client.email,
              phone: req.client.profile?.phoneNumber,
              address: req.address,
            }
          : {
              name: `${req.client.profile?.firstName} ${req.client.profile?.lastName?.[0] ?? ''}.`,
              email: '***@***.com (Desbloquea con créditos para ver)',
              phone: '********* (Desbloquea con créditos para ver)',
              address: 'Oculto (Desbloquea para ver)',
            },
      };
    });

    if (filter.onlyMatchingMyRadius) {
      return formatted.filter((item) => item.isWithinProRadius);
    }

    return formatted;
  }

  /**
   * Desbloquear los datos de contacto con actualización atómica condicional a nivel de PostgreSQL
   */
  async unlockLead(userId: string, requestId: string) {
    const pro = await this.prisma.professionalProfile.findUnique({
      where: { userId },
      include: {
        user: {
          include: { wallet: true },
        },
      },
    });

    if (!pro || !pro.user.wallet) {
      throw new ForbiddenException(
        'No tienes una billetera activa como profesional',
      );
    }

    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        client: {
          include: { profile: true },
        },
      },
    });

    if (!request || request.status !== LeadStatus.OPEN) {
      throw new NotFoundException('Solicitud no disponible o ya cerrada');
    }

    const existingUnlock = await this.prisma.leadUnlock.findUnique({
      where: {
        serviceRequestId_professionalProfileId: {
          serviceRequestId: requestId,
          professionalProfileId: pro.id,
        },
      },
    });

    if (existingUnlock) {
      throw new ConflictException(
        'Ya has desbloqueado los datos de esta solicitud',
      );
    }

    const wallet = pro.user.wallet;

    // Ejecutar transacción atómica condicional blindada contra condiciones de carrera
    return await this.prisma.$transaction(async (tx) => {
      // 1. Bloqueo atómico condicional en base de datos: incrementa unlocksCount solo si unlocksCount < maxUnlocks
      const updatedReqCount = await tx.$executeRaw`
        UPDATE "ServiceRequest"
        SET "unlocksCount" = "unlocksCount" + 1
        WHERE id = ${requestId} AND "unlocksCount" < "maxUnlocks" AND status = 'OPEN'
      `;

      if (updatedReqCount === 0) {
        throw new BadRequestException(
          'Esta solicitud ya ha alcanzado el límite máximo de profesionales permitidos',
        );
      }

      // 2. Bloqueo atómico condicional en billetera: decrementa créditos solo si creditBalance >= creditCost
      const updatedWalletCount = await tx.$executeRaw`
        UPDATE "Wallet"
        SET "creditBalance" = "creditBalance" - ${request.creditCost}
        WHERE id = ${wallet.id} AND "creditBalance" >= ${request.creditCost}
      `;

      if (updatedWalletCount === 0) {
        throw new BadRequestException(
          `Saldo insuficiente. Tienes ${wallet.creditBalance} créditos y necesitas ${request.creditCost} créditos. Recarga tu saldo.`,
        );
      }

      // 3. Crear registro de desbloqueo
      await tx.leadUnlock.create({
        data: {
          serviceRequestId: requestId,
          professionalProfileId: pro.id,
          creditsSpent: request.creditCost,
        },
      });

      // 4. Registrar movimiento en el libro mayor
      await tx.ledgerTransaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.LEAD_UNLOCK,
          creditAmount: -request.creditCost,
          status: TransactionStatus.COMPLETED,
          referenceId: requestId,
          metadata: {
            requestTitle: request.title,
            cost: request.creditCost,
          },
        },
      });

      // 5. Notificar al cliente
      await tx.notification.create({
        data: {
          userId: request.clientId,
          type: NotificationType.LEAD_MATCH,
          title: 'Un profesional ha contactado contigo',
          message: `${pro.businessName ?? 'Un profesional'} ha desbloqueado tu solicitud y puede enviarte un presupuesto.`,
          link: `/requests/${request.id}`,
        },
      });

      const updatedWallet = await tx.wallet.findUnique({
        where: { id: wallet.id },
      });

      return {
        success: true,
        message: 'Contacto desbloqueado con éxito',
        creditsSpent: request.creditCost,
        remainingCredits: updatedWallet?.creditBalance ?? 0,
        clientDetails: {
          firstName: request.client.profile?.firstName,
          lastName: request.client.profile?.lastName,
          email: request.client.email,
          phone: request.client.profile?.phoneNumber,
          address: request.address,
          city: request.city,
          postalCode: request.postalCode,
        },
      };
    });
  }

  /**
   * Enviar presupuesto u oferta para una solicitud previamente desbloqueada
   */
  async sendQuoteProposal(
    userId: string,
    requestId: string,
    dto: CreateQuoteProposalDto,
  ) {
    const pro = await this.prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (!pro) {
      throw new ForbiddenException('Debes tener un perfil profesional');
    }

    const unlock = await this.prisma.leadUnlock.findUnique({
      where: {
        serviceRequestId_professionalProfileId: {
          serviceRequestId: requestId,
          professionalProfileId: pro.id,
        },
      },
    });

    if (!unlock) {
      throw new ForbiddenException(
        'Debes desbloquear el contacto con créditos antes de enviar una oferta',
      );
    }

    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.status !== LeadStatus.OPEN) {
      throw new BadRequestException(
        'La solicitud ya no está abierta para recibir ofertas',
      );
    }

    const proposal = await this.prisma.quoteProposal.create({
      data: {
        serviceRequestId: requestId,
        professionalProfileId: pro.id,
        price: dto.price,
        estimatedDays: dto.estimatedDays,
        message: dto.message,
        breakdown: dto.breakdown,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
      include: {
        professionalProfile: {
          include: {
            user: { select: { profile: true } },
          },
        },
      },
    });

    // Notificar al cliente
    await this.prisma.notification.create({
      data: {
        userId: request.clientId,
        type: NotificationType.QUOTE_RECEIVED,
        title: 'Has recibido un nuevo presupuesto',
        message: `${pro.businessName ?? 'Un profesional'} te ha enviado un presupuesto de ${dto.price} € para "${request.title}".`,
        link: `/requests/${request.id}`,
      },
    });

    return proposal;
  }

  /**
   * Obtener solicitudes del cliente autenticado con sus presupuestos recibidos
   */
  async getMyRequests(userId: string) {
    return this.prisma.serviceRequest.findMany({
      where: { clientId: userId },
      include: {
        category: true,
        unlocks: {
          include: {
            professionalProfile: {
              include: {
                user: { select: { profile: true } },
              },
            },
          },
        },
        proposals: {
          include: {
            professionalProfile: {
              include: {
                user: { select: { profile: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * El cliente acepta un presupuesto y se genera el Pedido con Escrow
   */
  async acceptProposal(userId: string, proposalId: string) {
    const proposal = await this.prisma.quoteProposal.findUnique({
      where: { id: proposalId },
      include: {
        serviceRequest: true,
        professionalProfile: {
          include: { user: true },
        },
      },
    });

    if (!proposal || proposal.serviceRequest.clientId !== userId) {
      throw new ForbiddenException(
        'Presupuesto no válido o no eres el propietario',
      );
    }

    if (proposal.status !== ProposalStatus.PENDING) {
      throw new BadRequestException('El presupuesto ya ha sido procesado');
    }

    const price = Number(proposal.price);
    const platformCommissionPercent = 15;
    const platformFee =
      Math.round(price * (platformCommissionPercent / 100) * 100) / 100;
    const proEarnings = Math.round((price - platformFee) * 100) / 100;
    const totalAmount = price;

    const deliveryDeadline = new Date();
    deliveryDeadline.setDate(
      deliveryDeadline.getDate() + proposal.estimatedDays,
    );

    const orderNumber = `ORD-LEAD-${Date.now().toString().slice(-6)}`;

    return this.prisma.$transaction(async (tx) => {
      // 1. Aceptar presupuesto y rechazar los demás
      await tx.quoteProposal.update({
        where: { id: proposalId },
        data: { status: ProposalStatus.ACCEPTED },
      });

      await tx.quoteProposal.updateMany({
        where: {
          serviceRequestId: proposal.serviceRequestId,
          id: { not: proposalId },
        },
        data: { status: ProposalStatus.REJECTED },
      });

      // 2. Cerrar solicitud como completada/asignada
      await tx.serviceRequest.update({
        where: { id: proposal.serviceRequestId },
        data: { status: LeadStatus.FULFILLED },
      });

      // 3. Crear pedido con estado de Escrow HELD
      const order = await tx.order.create({
        data: {
          orderNumber,
          clientId: userId,
          professionalProfileId: proposal.professionalProfileId,
          orderType: OrderType.LEAD_CONTRACT,
          quoteProposalId: proposal.id,
          serviceRequestId: proposal.serviceRequestId,
          status: OrderStatus.IN_PROGRESS,
          subtotal: price,
          platformFee,
          totalAmount,
          proEarnings,
          escrowStatus: EscrowStatus.HELD,
          deliveryDeadline,
        },
      });

      // 4. Crear conversación de chat
      await tx.conversation.create({
        data: {
          orderId: order.id,
          serviceRequestId: proposal.serviceRequestId,
          participantAId: userId,
          participantBId: proposal.professionalProfile.user.id,
        },
      });

      // 5. Notificar al profesional
      await tx.notification.create({
        data: {
          userId: proposal.professionalProfile.user.id,
          type: NotificationType.QUOTE_ACCEPTED,
          title: '¡Tu presupuesto ha sido aceptado!',
          message: `El cliente ha aceptado tu propuesta de ${price} €. Se ha generado el pedido ${orderNumber}.`,
          link: `/orders/${order.id}`,
        },
      });

      return order;
    });
  }
}
