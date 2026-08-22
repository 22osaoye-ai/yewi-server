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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardStats() {
        const [totalUsers, totalPros, totalGigs, totalRequests, completedOrders, activeOrders,] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.professionalProfile.count(),
            this.prisma.gig.count({ where: { deletedAt: null } }),
            this.prisma.serviceRequest.count(),
            this.prisma.order.findMany({
                where: { status: client_1.OrderStatus.COMPLETED },
                select: { totalAmount: true, platformFee: true },
            }),
            this.prisma.order.count({
                where: {
                    status: {
                        in: [
                            client_1.OrderStatus.IN_PROGRESS,
                            client_1.OrderStatus.DELIVERED,
                            client_1.OrderStatus.REVISION_REQUESTED,
                            client_1.OrderStatus.PENDING_REQUIREMENTS,
                        ],
                    },
                },
            }),
        ]);
        const gmv = completedOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
        const totalPlatformRevenue = completedOrders.reduce((sum, o) => sum + Number(o.platformFee), 0);
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
    async getPendingKyc() {
        return this.prisma.professionalProfile.findMany({
            where: { kycStatus: client_1.KycStatus.PENDING_REVIEW },
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
    async reviewKyc(proId, dto) {
        const pro = await this.prisma.professionalProfile.findUnique({
            where: { id: proId },
            include: { user: true },
        });
        if (!pro) {
            throw new common_1.NotFoundException('Perfil profesional no encontrado');
        }
        const updated = await this.prisma.professionalProfile.update({
            where: { id: proId },
            data: {
                kycStatus: dto.status,
                kycRejectionReason: dto.status === client_1.KycStatus.REJECTED ? dto.rejectionReason : null,
                badges: dto.badges ? { set: dto.badges } : undefined,
            },
        });
        await this.prisma.notification.create({
            data: {
                userId: pro.userId,
                type: client_1.NotificationType.SYSTEM_ALERT,
                title: dto.status === client_1.KycStatus.VERIFIED
                    ? '¡Tu perfil profesional ha sido verificado!'
                    : 'Tu solicitud de verificación KYC ha sido rechazada',
                message: dto.status === client_1.KycStatus.VERIFIED
                    ? 'Tu documento ha sido aprobado. Ahora cuentas con el distintivo de Profesional Verificado.'
                    : `Motivo del rechazo: ${dto.rejectionReason ?? 'Documentación incompleta.'}`,
            },
        });
        return updated;
    }
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
    async resolveDispute(adminUserId, disputeId, dto) {
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
            throw new common_1.NotFoundException('Disputa no encontrada');
        }
        if (dispute.status !== 'OPEN') {
            throw new common_1.BadRequestException('Esta disputa ya ha sido resuelta');
        }
        const order = dispute.order;
        const totalOrderAmount = Number(order.totalAmount);
        if (dto.refundAmountClient + dto.payoutAmountPro > totalOrderAmount) {
            throw new common_1.BadRequestException(`La suma a reembolsar y pagar (${dto.refundAmountClient + dto.payoutAmountPro} €) no puede exceder el total del pedido (${totalOrderAmount} €)`);
        }
        return this.prisma.$transaction(async (tx) => {
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
            await tx.order.update({
                where: { id: order.id },
                data: {
                    status: client_1.OrderStatus.COMPLETED,
                    escrowStatus: dto.refundAmountClient > 0
                        ? client_1.EscrowStatus.PARTIALLY_REFUNDED
                        : client_1.EscrowStatus.RELEASED_TO_PRO,
                },
            });
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
                        type: client_1.TransactionType.ORDER_REFUND,
                        amount: dto.refundAmountClient,
                        currency: 'EUR',
                        status: client_1.TransactionStatus.COMPLETED,
                        referenceId: order.id,
                    },
                });
            }
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
                        type: client_1.TransactionType.ESCROW_RELEASE,
                        amount: dto.payoutAmountPro,
                        currency: 'EUR',
                        status: client_1.TransactionStatus.COMPLETED,
                        referenceId: order.id,
                    },
                });
            }
            await tx.notification.createMany({
                data: [
                    {
                        userId: order.clientId,
                        type: client_1.NotificationType.DISPUTE_OPENED,
                        title: 'Disputa resuelta por administración',
                        message: `Resolución del pedido ${order.orderNumber}: Reembolso de ${dto.refundAmountClient} €. Nota: ${dto.resolutionNotes}`,
                        link: `/orders/${order.id}`,
                    },
                    {
                        userId: order.professionalProfile.user.id,
                        type: client_1.NotificationType.DISPUTE_OPENED,
                        title: 'Disputa resuelta por administración',
                        message: `Resolución del pedido ${order.orderNumber}: Pago de ${dto.payoutAmountPro} €. Nota: ${dto.resolutionNotes}`,
                        link: `/orders/${order.id}`,
                    },
                ],
            });
            return resolvedDispute;
        });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map