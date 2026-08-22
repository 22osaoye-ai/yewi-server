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
var LeadsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const geo_utils_1 = require("../../common/utils/geo.utils");
const prisma_service_1 = require("../../database/prisma.service");
let LeadsService = LeadsService_1 = class LeadsService {
    prisma;
    logger = new common_1.Logger(LeadsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createRequest(userId, dto) {
        const category = await this.prisma.category.findUnique({
            where: { id: dto.categoryId },
        });
        if (!category) {
            throw new common_1.NotFoundException('Categoría no encontrada');
        }
        const baseCost = category.baseLeadCreditCost ?? 10;
        const creditCost = dto.isUrgent ? Math.round(baseCost * 1.5) : baseCost;
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
                status: client_1.LeadStatus.OPEN,
                expiresAt,
            },
            include: {
                category: true,
            },
        });
    }
    async findOpportunitiesForPro(userId, filter) {
        const pro = await this.prisma.professionalProfile.findUnique({
            where: { userId },
            include: { categories: true },
        });
        if (!pro) {
            throw new common_1.ForbiddenException('Debes tener un perfil profesional');
        }
        const where = {
            status: client_1.LeadStatus.OPEN,
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
        const formatted = requests.map((req) => {
            const isUnlocked = req.unlocks.length > 0;
            let distanceKm = null;
            if (pro.latitude && pro.longitude && req.latitude && req.longitude) {
                distanceKm = geo_utils_1.GeoUtils.calculateHaversineDistance(pro.latitude, pro.longitude, req.latitude, req.longitude);
            }
            const isWithinProRadius = distanceKm !== null ? distanceKm <= pro.serviceRadiusKm : true;
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
    async unlockLead(userId, requestId) {
        const pro = await this.prisma.professionalProfile.findUnique({
            where: { userId },
            include: {
                user: {
                    include: { wallet: true },
                },
            },
        });
        if (!pro || !pro.user.wallet) {
            throw new common_1.ForbiddenException('No tienes una billetera activa como profesional');
        }
        const request = await this.prisma.serviceRequest.findUnique({
            where: { id: requestId },
            include: {
                client: {
                    include: { profile: true },
                },
            },
        });
        if (!request || request.status !== client_1.LeadStatus.OPEN) {
            throw new common_1.NotFoundException('Solicitud no disponible o ya cerrada');
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
            throw new common_1.ConflictException('Ya has desbloqueado los datos de esta solicitud');
        }
        const wallet = pro.user.wallet;
        return await this.prisma.$transaction(async (tx) => {
            const updatedReqCount = await tx.$executeRaw `
        UPDATE "ServiceRequest"
        SET "unlocksCount" = "unlocksCount" + 1
        WHERE id = ${requestId} AND "unlocksCount" < "maxUnlocks" AND status = 'OPEN'
      `;
            if (updatedReqCount === 0) {
                throw new common_1.BadRequestException('Esta solicitud ya ha alcanzado el límite máximo de profesionales permitidos');
            }
            const updatedWalletCount = await tx.$executeRaw `
        UPDATE "Wallet"
        SET "creditBalance" = "creditBalance" - ${request.creditCost}
        WHERE id = ${wallet.id} AND "creditBalance" >= ${request.creditCost}
      `;
            if (updatedWalletCount === 0) {
                throw new common_1.BadRequestException(`Saldo insuficiente. Tienes ${wallet.creditBalance} créditos y necesitas ${request.creditCost} créditos. Recarga tu saldo.`);
            }
            await tx.leadUnlock.create({
                data: {
                    serviceRequestId: requestId,
                    professionalProfileId: pro.id,
                    creditsSpent: request.creditCost,
                },
            });
            await tx.ledgerTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: client_1.TransactionType.LEAD_UNLOCK,
                    creditAmount: -request.creditCost,
                    status: client_1.TransactionStatus.COMPLETED,
                    referenceId: requestId,
                    metadata: {
                        requestTitle: request.title,
                        cost: request.creditCost,
                    },
                },
            });
            await tx.notification.create({
                data: {
                    userId: request.clientId,
                    type: client_1.NotificationType.LEAD_MATCH,
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
    async sendQuoteProposal(userId, requestId, dto) {
        const pro = await this.prisma.professionalProfile.findUnique({
            where: { userId },
        });
        if (!pro) {
            throw new common_1.ForbiddenException('Debes tener un perfil profesional');
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
            throw new common_1.ForbiddenException('Debes desbloquear el contacto con créditos antes de enviar una oferta');
        }
        const request = await this.prisma.serviceRequest.findUnique({
            where: { id: requestId },
        });
        if (!request || request.status !== client_1.LeadStatus.OPEN) {
            throw new common_1.BadRequestException('La solicitud ya no está abierta para recibir ofertas');
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
        await this.prisma.notification.create({
            data: {
                userId: request.clientId,
                type: client_1.NotificationType.QUOTE_RECEIVED,
                title: 'Has recibido un nuevo presupuesto',
                message: `${pro.businessName ?? 'Un profesional'} te ha enviado un presupuesto de ${dto.price} € para "${request.title}".`,
                link: `/requests/${request.id}`,
            },
        });
        return proposal;
    }
    async getMyRequests(userId) {
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
    async acceptProposal(userId, proposalId) {
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
            throw new common_1.ForbiddenException('Presupuesto no válido o no eres el propietario');
        }
        if (proposal.status !== client_1.ProposalStatus.PENDING) {
            throw new common_1.BadRequestException('El presupuesto ya ha sido procesado');
        }
        const price = Number(proposal.price);
        const platformCommissionPercent = 15;
        const platformFee = Math.round(price * (platformCommissionPercent / 100) * 100) / 100;
        const proEarnings = Math.round((price - platformFee) * 100) / 100;
        const totalAmount = price;
        const deliveryDeadline = new Date();
        deliveryDeadline.setDate(deliveryDeadline.getDate() + proposal.estimatedDays);
        const orderNumber = `ORD-LEAD-${Date.now().toString().slice(-6)}`;
        return this.prisma.$transaction(async (tx) => {
            await tx.quoteProposal.update({
                where: { id: proposalId },
                data: { status: client_1.ProposalStatus.ACCEPTED },
            });
            await tx.quoteProposal.updateMany({
                where: {
                    serviceRequestId: proposal.serviceRequestId,
                    id: { not: proposalId },
                },
                data: { status: client_1.ProposalStatus.REJECTED },
            });
            await tx.serviceRequest.update({
                where: { id: proposal.serviceRequestId },
                data: { status: client_1.LeadStatus.FULFILLED },
            });
            const order = await tx.order.create({
                data: {
                    orderNumber,
                    clientId: userId,
                    professionalProfileId: proposal.professionalProfileId,
                    orderType: client_1.OrderType.LEAD_CONTRACT,
                    quoteProposalId: proposal.id,
                    serviceRequestId: proposal.serviceRequestId,
                    status: client_1.OrderStatus.IN_PROGRESS,
                    subtotal: price,
                    platformFee,
                    totalAmount,
                    proEarnings,
                    escrowStatus: client_1.EscrowStatus.HELD,
                    deliveryDeadline,
                },
            });
            await tx.conversation.create({
                data: {
                    orderId: order.id,
                    serviceRequestId: proposal.serviceRequestId,
                    participantAId: userId,
                    participantBId: proposal.professionalProfile.user.id,
                },
            });
            await tx.notification.create({
                data: {
                    userId: proposal.professionalProfile.user.id,
                    type: client_1.NotificationType.QUOTE_ACCEPTED,
                    title: '¡Tu presupuesto ha sido aceptado!',
                    message: `El cliente ha aceptado tu propuesta de ${price} €. Se ha generado el pedido ${orderNumber}.`,
                    link: `/orders/${order.id}`,
                },
            });
            return order;
        });
    }
};
exports.LeadsService = LeadsService;
exports.LeadsService = LeadsService = LeadsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeadsService);
//# sourceMappingURL=leads.service.js.map