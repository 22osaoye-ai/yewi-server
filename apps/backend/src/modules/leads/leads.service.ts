import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  EscrowStatus,
  LeadStatus,
  NotificationType,
  OrderStatus,
  OrderType,
  Prisma,
  ProposalStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { GeoUtils } from '../../common/utils/geo.utils';
import { PrismaService } from '../../database/prisma.service';
import { CreateQuoteProposalDto } from './dto/create-quote-proposal.dto';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { FilterLeadsDto } from './dto/filter-leads.dto';
import { RealtimeService } from '../../common/realtime/realtime.service';

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly realtime?: RealtimeService,
  ) {}

  /**
   * Crear una solicitud de servicio (Cliente - ProntoPro Style)
   */
  async createRequest(userId: string, dto: CreateServiceRequestDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      const categoryQuery = dto.categoryId || dto.category || 'Electricidad';
      let category = await tx.category.findFirst({
        where: {
          OR: [
            { id: categoryQuery },
            { slug: categoryQuery.toLowerCase().trim() },
            { name: { equals: categoryQuery, mode: 'insensitive' } },
          ],
        },
      });

      if (!category) {
        category = await tx.category.findFirst({
          where: { isActive: true },
        });
      }

      if (!category) {
        category = await tx.category.create({
          data: {
            name: categoryQuery,
            slug: categoryQuery.toLowerCase().trim().replace(/\s+/g, '-'),
            baseLeadCreditCost: 10,
          },
        });
      }

      // Expiración por defecto a 14 días
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 14);

      const budgetMax = dto.budgetMax ?? dto.budgetEstimated;

      const newRequest = await tx.serviceRequest.create({
        data: {
          clientId: userId,
          categoryId: category.id,
          title: dto.title,
          description: dto.description,
          questionnaireAnswers: dto.questionnaireAnswers ?? {},
          budgetMin: dto.budgetMin,
          budgetMax: budgetMax,
          isUrgent: dto.isUrgent ?? false,
          preferredDate: dto.preferredDate ? new Date(dto.preferredDate) : null,
          postalCode: dto.postalCode || '50001',
          city: dto.city || 'Zaragoza',
          country: dto.country ?? 'ES',
          address: dto.address,
          latitude: dto.latitude,
          longitude: dto.longitude,
          isRemote: dto.isRemote ?? false,
          creditCost: 0,
          maxUnlocks: 5,
          unlocksCount: 0,
          status: LeadStatus.OPEN,
          expiresAt,
        },
        include: {
          category: true,
        },
      });

      // Notificar a profesionales cuyos intereses/habilidades coincidan con la categoría
      const matchingPros = await tx.professionalProfile.findMany({
        where: {
          userId: { not: userId },
          OR: [
            {
              skills: {
                hasSome: [category.name, categoryQuery, category.slug],
              },
            },
            { categories: { some: { id: category.id } } },
          ],
        },
        select: { userId: true },
      });

      if (matchingPros.length > 0) {
        await tx.notification.createMany({
          data: matchingPros.map((pro) => ({
            userId: pro.userId,
            type: NotificationType.LEAD_MATCH,
            title: `🛠️ Nueva Oportunidad: ${category.name}`,
            message: `${dto.title} en ${dto.city || 'tu zona'}. Presupuesto est.: ${budgetMax ? `${budgetMax}€` : 'A convenir'}.`,
            link: `/requests?id=${newRequest.id}`,
            metadata: {
              requestId: newRequest.id,
              category: category.name,
              city: dto.city,
              budgetMax,
            },
          })),
        });
      }

      Object.defineProperty(newRequest, '__matchingProIds', {
        value: matchingPros.map((pro) => pro.userId),
        enumerable: false,
      });
      return newRequest;
    });
    const matchingProIds = (result as any).__matchingProIds as string[];
    matchingProIds.forEach((proId) => {
      this.realtime?.emitLead(proId, result);
      this.realtime?.emitNotification({
        id: null,
        userId: proId,
        type: NotificationType.LEAD_MATCH,
        title: `🛠️ Nueva Oportunidad: ${result.category.name}`,
        message: `${result.title} en ${result.city || 'tu zona'}. Presupuesto est.: ${
          result.budgetMax ? `${result.budgetMax}€` : 'A convenir'
        }.`,
        link: `/requests?id=${result.id}`,
        metadata: {
          requestId: result.id,
          category: result.category.name,
          city: result.city,
          budgetMax: result.budgetMax,
        },
        isRead: false,
        createdAt: null,
      });
    });
    return result;
  }

  /**
   * Listar oportunidades de negocio para un profesional con cálculo de radio y estado de desbloqueo
   */
  async findOpportunitiesForPro(userId: string, filter: FilterLeadsDto) {
    const pro = await this.prisma.professionalProfile.findUnique({
      where: { userId },
      include: {
        categories: true,
        user: {
          select: {
            subscription: {
              select: {
                status: true,
                stripeSubscriptionId: true,
                stripeCustomerId: true,
              },
            },
          },
        },
      },
    });

    if (!pro) {
      throw new ForbiddenException('Debes tener un perfil profesional');
    }

    const isPro = this.hasActiveProSubscription(pro);

    // Obtener las categorías y especialidades registradas por el profesional
    const proCategoryIds = (pro.categories || []).map((c) => c.id);
    const proSkills = pro.skills || [];
    const proCategoryNames = (pro.categories || []).map((c) => c.name);
    const allProKeywords = Array.from(new Set([...proCategoryNames, ...proSkills]));

    // Si el profesional no tiene categorías ni habilidades configuradas, no mostrar solicitudes no relacionadas
    if (proCategoryIds.length === 0 && allProKeywords.length === 0) {
      return [];
    }

    const where: Prisma.ServiceRequestWhereInput = {
      status: LeadStatus.OPEN,
      expiresAt: { gt: new Date() },
      clientId: { not: userId },
      proposals: {
        none: {
          professionalProfileId: pro.id,
        },
      },
    };

    const catQuery = filter.categoryId || filter.category;
    if (catQuery) {
      where.OR = [
        { categoryId: catQuery },
        { category: { name: { equals: catQuery, mode: 'insensitive' } } },
        { category: { slug: catQuery.toLowerCase().trim() } },
      ];
    } else {
      // Filtrar estrictamente por los intereses / especialidades del seller
      where.OR = [
        { categoryId: { in: proCategoryIds } },
        {
          category: {
            name: {
              in: allProKeywords,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    // Si NO es PRO y se filtra por ciudad, mantener filtro. Si es PRO, tiene cobertura nacional libre.
    if (filter.city && !isPro) {
      where.city = { contains: filter.city.trim(), mode: 'insensitive' };
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

    // Procesar cada oportunidad: PRO tiene datos de contacto directos y cobertura nacional
    const formatted = requests.map((req) => {
      const isUnlocked = isPro;
      let distanceKm: number | null = null;

      if (pro.latitude && pro.longitude && req.latitude && req.longitude) {
        distanceKm = GeoUtils.calculateHaversineDistance(
          pro.latitude,
          pro.longitude,
          req.latitude,
          req.longitude,
        );
      }

      // Si es PRO, no tiene límite de radio (cobertura nacional total)
      const isWithinProRadius = isPro
        ? true
        : distanceKm !== null
          ? distanceKm <= pro.serviceRadiusKm
          : true;

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
        creditCost: 0,
        unlocksCount: req.unlocksCount,
        maxUnlocks: req.maxUnlocks,
        remainingUnlocks: Math.max(0, req.maxUnlocks - req.unlocksCount),
        distanceKm,
        isWithinProRadius,
        isUnlockedByMe: isUnlocked,
        isProBenefit: isPro,
        createdAt: req.createdAt,
        expiresAt: req.expiresAt,
        client: isUnlocked
          ? {
              name:
                `${req.client.profile?.firstName ?? ''} ${req.client.profile?.lastName ?? ''}`.trim() ||
                'Cliente Yewi',
              email: req.client.email,
              phone: req.client.profile?.phoneNumber || 'No especificado',
              address: req.address || `${req.city} (${req.postalCode})`,
            }
          : {
              name: `${req.client.profile?.firstName ?? 'Cliente'} ${req.client.profile?.lastName?.[0] ?? ''}.`,
              email: '***@***.com (Suscríbete a Pro para ver)',
              phone: '********* (Suscríbete a Pro para ver)',
              address: `${req.city} (Suscríbete a Pro para ver calle)`,
            },
      };
    });

    if (filter.onlyMatchingMyRadius && !isPro) {
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
          select: {
            subscription: {
              select: {
                status: true,
                stripeSubscriptionId: true,
                stripeCustomerId: true,
              },
            },
          },
        },
      },
    });

    if (!pro) {
      throw new ForbiddenException('Debes tener un perfil profesional');
    }
    if (!this.hasActiveProSubscription(pro)) {
      throw new ForbiddenException(
        'Necesitas una suscripción Yewi Pro activa para desbloquear solicitudes',
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

    // Ejecutar transacción atómica condicional blindada contra condiciones de carrera
    const result = await this.prisma.$transaction(async (tx) => {
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

      // 2. Crear registro de desbloqueo sin débito de créditos
      await tx.leadUnlock.create({
        data: {
          serviceRequestId: requestId,
          professionalProfileId: pro.id,
          creditsSpent: 0,
        },
      });

      // 3. Notificar al cliente
      const notification = await tx.notification.create({
        data: {
          userId: request.clientId,
          type: NotificationType.LEAD_MATCH,
          title: 'Un profesional ha contactado contigo',
          message: `${pro.businessName ?? 'Un profesional'} ha desbloqueado tu solicitud y puede enviarte un presupuesto.`,
          link: `/requests/${request.id}`,
        },
      });

      return {
        notification,
        success: true,
        message: 'Contacto desbloqueado con éxito',
        creditsSpent: 0,
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
    this.realtime?.emitNotification(result.notification);
    return result;
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
      include: {
        user: {
          select: {
            subscription: {
              select: {
                status: true,
                stripeSubscriptionId: true,
                stripeCustomerId: true,
              },
            },
          },
        },
      },
    });

    if (!pro) {
      throw new ForbiddenException('Debes tener un perfil profesional');
    }
    if (!this.hasActiveProSubscription(pro)) {
      throw new ForbiddenException(
        'Necesitas una suscripción Yewi Pro activa para enviar presupuestos',
      );
    }

    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        orders: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (request.clientId === userId) {
      throw new BadRequestException(
        'No puedes enviar un presupuesto a tu propia solicitud',
      );
    }

    if (request.status !== LeadStatus.OPEN) {
      throw new BadRequestException(
        'La solicitud ya no está abierta para recibir ofertas (está en curso o finalizada)',
      );
    }

    const activeOrder = (request.orders || []).find(
      (o) =>
        o.status === OrderStatus.IN_PROGRESS ||
        o.status === OrderStatus.COMPLETED ||
        o.status === OrderStatus.DELIVERED,
    );
    if (activeOrder) {
      throw new BadRequestException(
        'Esta solicitud ya tiene un presupuesto aceptado y un trabajo en curso',
      );
    }

    const existingProposal = await this.prisma.quoteProposal.findFirst({
      where: {
        serviceRequestId: requestId,
        professionalProfileId: pro.id,
      },
    });

    if (existingProposal) {
      throw new BadRequestException(
        'Ya has enviado un presupuesto para esta solicitud. No puedes enviar más de una propuesta.',
      );
    }

    let unlock = await this.prisma.leadUnlock.findUnique({
      where: {
        serviceRequestId_professionalProfileId: {
          serviceRequestId: requestId,
          professionalProfileId: pro.id,
        },
      },
    });

    // Si el profesional es Pro y aún no tiene registro de desbloqueo, se crea automáticamente
    if (!unlock) {
      unlock = await this.prisma.leadUnlock.create({
        data: {
          serviceRequestId: requestId,
          professionalProfileId: pro.id,
          creditsSpent: 0,
        },
      });
      await this.prisma.serviceRequest.update({
        where: { id: requestId },
        data: { unlocksCount: { increment: 1 } },
      });
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
    const notification = await this.prisma.notification.create({
      data: {
        userId: request.clientId,
        type: NotificationType.QUOTE_RECEIVED,
        title: 'Has recibido un nuevo presupuesto',
        message: `${pro.businessName ?? 'Un profesional'} te ha enviado un presupuesto de ${dto.price} € para "${request.title}".`,
        link: `/requests/${request.id}`,
      },
    });
    this.realtime?.emitNotification(notification);

    return proposal;
  }

  private hasActiveProSubscription(pro: {
    isPro?: boolean;
    user?: {
      isPro?: boolean;
      subscription?: {
        status: SubscriptionStatus;
        stripeSubscriptionId: string | null;
        stripeCustomerId: string | null;
      } | null;
    } | null;
  }) {
    if (pro.isPro || pro.user?.isPro) return true;
    const subscription = pro.user?.subscription;
    return Boolean(
      subscription &&
        (subscription.status === SubscriptionStatus.ACTIVE ||
          subscription.status === SubscriptionStatus.TRIALING) &&
        subscription.stripeSubscriptionId &&
        subscription.stripeCustomerId,
    );
  }


  /**
   * Obtener solicitudes del cliente autenticado con sus presupuestos recibidos y pedidos formalizados
   */
  async getMyRequests(userId: string) {
    return this.prisma.serviceRequest.findMany({
      where: { clientId: userId },
      include: {
        category: true,
        orders: {
          include: {
            professionalProfile: {
              include: {
                user: { select: { id: true, profile: true } },
              },
            },
          },
        },
        unlocks: {
          include: {
            professionalProfile: {
              include: {
                user: { select: { id: true, profile: true } },
              },
            },
          },
        },
        proposals: {
          include: {
            professionalProfile: {
              include: {
                user: { select: { id: true, profile: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtener detalle completo de una solicitud por ID
   */
  async getRequestById(userId: string, requestId: string) {
    const pro = await this.prisma.professionalProfile.findUnique({
      where: { userId },
    });

    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        category: true,
        client: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
        orders: {
          include: {
            professionalProfile: {
              include: {
                user: { select: { id: true, profile: true } },
              },
            },
          },
        },
        proposals: {
          include: {
            professionalProfile: {
              include: {
                user: { select: { id: true, profile: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        unlocks: pro
          ? {
              where: { professionalProfileId: pro.id },
            }
          : false,
      },
    });

    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    const isClient = request.clientId === userId;
    const isUnlocked = Boolean(request.unlocks && request.unlocks.length > 0);

    const myProposal = pro
      ? request.proposals.find((p) => p.professionalProfileId === pro.id) || null
      : null;

    const activeOrder = request.orders.find(
      (o) =>
        o.status === OrderStatus.IN_PROGRESS ||
        o.status === OrderStatus.COMPLETED ||
        o.status === OrderStatus.DELIVERED,
    ) || null;

    return {
      ...request,
      isUnlockedByMe: isUnlocked || isClient,
      myProposal,
      activeOrder,
      isAssignedToMe: pro && activeOrder ? activeOrder.professionalProfileId === pro.id : false,
    };
  }

  /**
   * Eliminar o cancelar una solicitud de servicio (Solo el propietario)
   */
  async deleteServiceRequest(userId: string, requestId: string) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: { orders: true },
    });

    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (request.clientId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar esta solicitud',
      );
    }

    const hasActiveOrder = request.orders.some(
      (o) =>
        o.status === OrderStatus.IN_PROGRESS ||
        o.status === OrderStatus.PENDING_REQUIREMENTS,
    );
    if (hasActiveOrder) {
      throw new BadRequestException(
        'No puedes eliminar una solicitud que tiene un pedido o contrato en curso',
      );
    }

    await this.prisma.serviceRequest.delete({
      where: { id: requestId },
    });

    return { success: true, message: 'Solicitud eliminada correctamente' };
  }

  /**
   * Obtener todas las propuestas/presupuestos enviados por el profesional autenticado
   */
  async getMyProposals(userId: string) {
    const pro = await this.prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (!pro) {
      throw new ForbiddenException('Debes tener un perfil profesional');
    }

    const proposals = await this.prisma.quoteProposal.findMany({
      where: { professionalProfileId: pro.id },
      include: {
        serviceRequest: {
          include: {
            category: true,
            client: {
              select: {
                id: true,
                email: true,
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
              },
            },
            conversations: {
              select: { id: true },
              take: 1,
            },
          },
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            escrowStatus: true,
            totalAmount: true,
            deliveryDeadline: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return proposals.map((prop) => {
      const order =
        prop.orders && prop.orders.length > 0 ? prop.orders[0] : null;
      const conversationId =
        prop.serviceRequest.conversations &&
        prop.serviceRequest.conversations.length > 0
          ? prop.serviceRequest.conversations[0].id
          : null;

      const isAccepted = prop.status === ProposalStatus.ACCEPTED;
      return {
        ...prop,
        order,
        conversationId,
        client: isAccepted
          ? {
              id: prop.serviceRequest.client.id,
              name:
                prop.serviceRequest.client.profile?.displayName ||
                `${prop.serviceRequest.client.profile?.firstName ?? ''} ${prop.serviceRequest.client.profile?.lastName ?? ''}`.trim() ||
                'Cliente Yewi',
              avatarUrl: prop.serviceRequest.client.profile?.avatarUrl,
              phone:
                prop.serviceRequest.client.profile?.phoneNumber ||
                'No especificado',
              email: prop.serviceRequest.client.email,
              city:
                prop.serviceRequest.client.profile?.city ||
                prop.serviceRequest.city,
              address:
                prop.serviceRequest.client.profile?.address ||
                prop.serviceRequest.address,
            }
          : {
              id: prop.serviceRequest.client.id,
              name: `${prop.serviceRequest.client.profile?.firstName ?? 'Cliente'} ${prop.serviceRequest.client.profile?.lastName?.[0] ?? ''}.`,
              avatarUrl: prop.serviceRequest.client.profile?.avatarUrl,
              city: prop.serviceRequest.city,
            },
      };
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

    const result = await this.prisma.$transaction(async (tx) => {
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

      // 4. Crear conversación de chat vinculada
      const conversation = await tx.conversation.create({
        data: {
          orderId: order.id,
          serviceRequestId: proposal.serviceRequestId,
          participantAId: userId,
          participantBId: proposal.professionalProfile.user.id,
        },
      });

      // 5. Notificar al profesional
      const notification = await tx.notification.create({
        data: {
          userId: proposal.professionalProfile.user.id,
          type: NotificationType.QUOTE_ACCEPTED,
          title: '¡Tu presupuesto ha sido aceptado!',
          message: `El cliente ha aceptado tu propuesta de ${price} €. Se ha generado el pedido ${orderNumber}.`,
          link: `/orders/${order.id}`,
        },
      });

      return { order, conversation, notification };
    });

    this.realtime?.emitNotification(result.notification);

    return {
      ...result.order,
      conversationId: result.conversation.id,
    };
  }
}
