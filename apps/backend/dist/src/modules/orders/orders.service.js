"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let OrdersService = class OrdersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createGigOrder(userId, dto) {
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
            throw new common_1.NotFoundException('Paquete de servicio no encontrado');
        }
        if (pkg.gig.professionalProfile.userId === userId) {
            throw new common_1.BadRequestException('No puedes comprar tu propio servicio');
        }
        let subtotal = Number(pkg.price);
        let totalDays = pkg.deliveryDays;
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
        const platformFee = Math.round(subtotal * (platformCommissionPercent / 100) * 100) / 100;
        const proEarnings = Math.round((subtotal - platformFee) * 100) / 100;
        const totalAmount = subtotal;
        const deliveryDeadline = new Date();
        deliveryDeadline.setDate(deliveryDeadline.getDate() + Math.max(1, totalDays));
        const orderNumber = `ORD-GIG-${Date.now().toString().slice(-6)}`;
        const hasRequirements = !!dto.requirementsAnswers &&
            Object.keys(dto.requirementsAnswers).length > 0;
        return this.prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    orderNumber,
                    clientId: userId,
                    professionalProfileId: pkg.gig.professionalProfileId,
                    orderType: client_1.OrderType.GIG_PURCHASE,
                    gigId: pkg.gigId,
                    gigPackageId: pkg.id,
                    status: hasRequirements
                        ? client_1.OrderStatus.IN_PROGRESS
                        : client_1.OrderStatus.PENDING_REQUIREMENTS,
                    subtotal,
                    platformFee,
                    totalAmount,
                    proEarnings,
                    escrowStatus: client_1.EscrowStatus.HELD,
                    requirementsAnswers: dto.requirementsAnswers,
                    deliveryDeadline,
                },
            });
            await tx.conversation.create({
                data: {
                    orderId: order.id,
                    participantAId: userId,
                    participantBId: pkg.gig.professionalProfile.userId,
                },
            });
            await tx.notification.create({
                data: {
                    userId: pkg.gig.professionalProfile.userId,
                    type: client_1.NotificationType.ORDER_CREATED,
                    title: '¡Tienes un nuevo pedido!',
                    message: `Has recibido un nuevo pedido de ${totalAmount} € para tu servicio "${pkg.gig.title}".`,
                    link: `/orders/${order.id}`,
                },
            });
            return order;
        });
    }
    async submitRequirements(userId, orderId, dto) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });
        if (!order || order.clientId !== userId) {
            throw new common_1.ForbiddenException('Pedido no encontrado o no autorizado');
        }
        if (order.status !== client_1.OrderStatus.PENDING_REQUIREMENTS) {
            throw new common_1.BadRequestException('Los requerimientos ya han sido enviados');
        }
        return this.prisma.order.update({
            where: { id: orderId },
            data: {
                requirementsAnswers: dto.requirementsAnswers,
                status: client_1.OrderStatus.IN_PROGRESS,
            },
        });
    }
    async submitDelivery(userId, orderId, dto) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                professionalProfile: true,
                deliveries: true,
            },
        });
        if (!order || order.professionalProfile.userId !== userId) {
            throw new common_1.ForbiddenException('Solo el profesional asignado puede realizar entregas');
        }
        if (order.status !== client_1.OrderStatus.IN_PROGRESS &&
            order.status !== client_1.OrderStatus.REVISION_REQUESTED) {
            throw new common_1.BadRequestException('El pedido no está en estado activo para recibir entregas');
        }
        const deliveryNumber = order.deliveries.length + 1;
        return this.prisma.$transaction(async (tx) => {
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
                data: { status: client_1.OrderStatus.DELIVERED },
            });
            await tx.notification.create({
                data: {
                    userId: order.clientId,
                    type: client_1.NotificationType.ORDER_DELIVERED,
                    title: '¡Entrega de trabajo recibida!',
                    message: `El profesional ha enviado la entrega #${deliveryNumber} para el pedido ${order.orderNumber}. Revisa los archivos y aprueba o solicita revisión.`,
                    link: `/orders/${order.id}`,
                },
            });
            return delivery;
        });
    }
    async requestRevision(userId, orderId, dto) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { professionalProfile: true },
        });
        if (!order || order.clientId !== userId) {
            throw new common_1.ForbiddenException('Solo el comprador puede solicitar revisiones');
        }
        if (order.status !== client_1.OrderStatus.DELIVERED) {
            throw new common_1.BadRequestException('Solo puedes solicitar revisión de un trabajo entregado');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.order.update({
                where: { id: orderId },
                data: { status: client_1.OrderStatus.REVISION_REQUESTED },
            });
            await tx.notification.create({
                data: {
                    userId: order.professionalProfile.userId,
                    type: client_1.NotificationType.REVISION_REQUESTED,
                    title: 'El cliente ha solicitado una revisión',
                    message: `Revisión solicitada para ${order.orderNumber}: "${dto.revisionNotes}"`,
                    link: `/orders/${order.id}`,
                },
            });
            return { message: 'Solicitud de revisión enviada al profesional' };
        });
    }
    async approveDelivery(userId, orderId) {
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
            throw new common_1.ForbiddenException('Solo el comprador puede aprobar la entrega');
        }
        if (order.status !== client_1.OrderStatus.DELIVERED) {
            throw new common_1.BadRequestException('El pedido debe estar en estado ENTREGADO para ser completado');
        }
        const proUser = order.professionalProfile.user;
        const earnings = Number(order.proEarnings);
        return this.prisma.$transaction(async (tx) => {
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    status: client_1.OrderStatus.COMPLETED,
                    escrowStatus: client_1.EscrowStatus.RELEASED_TO_PRO,
                    autoCompletedAt: new Date(),
                },
            });
            if (proUser.wallet) {
                await tx.wallet.update({
                    where: { id: proUser.wallet.id },
                    data: {
                        fiatAvailableBalance: { increment: earnings },
                    },
                });
                await tx.ledgerTransaction.create({
                    data: {
                        walletId: proUser.wallet.id,
                        type: client_1.TransactionType.ESCROW_RELEASE,
                        amount: earnings,
                        currency: 'EUR',
                        status: client_1.TransactionStatus.COMPLETED,
                        referenceId: order.id,
                        metadata: {
                            orderNumber: order.orderNumber,
                            totalAmount: Number(order.totalAmount),
                            platformFee: Number(order.platformFee),
                        },
                    },
                });
            }
            await tx.professionalProfile.update({
                where: { id: order.professionalProfileId },
                data: {
                    completedOrdersCount: { increment: 1 },
                },
            });
            if (order.gigId) {
                await tx.gig.update({
                    where: { id: order.gigId },
                    data: {
                        ordersCount: { increment: 1 },
                    },
                });
            }
            await tx.notification.create({
                data: {
                    userId: proUser.id,
                    type: client_1.NotificationType.ORDER_COMPLETED,
                    title: '¡Pedido aprobado y fondos liberados!',
                    message: `El cliente ha completado el pedido ${order.orderNumber}. Se han acreditado ${earnings} € a tu saldo disponible.`,
                    link: `/orders/${order.id}`,
                },
            });
            return updatedOrder;
        });
    }
    async openDispute(userId, orderId, dto) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { professionalProfile: true },
        });
        if (!order ||
            (order.clientId !== userId && order.professionalProfile.userId !== userId)) {
            throw new common_1.ForbiddenException('No tienes acceso a este pedido');
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
                data: { status: client_1.OrderStatus.DISPUTED },
            });
            return dispute;
        });
    }
    async getOrderById(userId, orderId) {
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
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        if (order.clientId !== userId &&
            order.professionalProfile.user.id !== userId) {
            throw new common_1.ForbiddenException('No estás autorizado para ver este pedido');
        }
        return order;
    }
    async getMyOrders(userId, role) {
        const pro = await this.prisma.professionalProfile.findUnique({
            where: { userId },
        });
        if (role === 'pro') {
            if (!pro)
                return [];
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
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map