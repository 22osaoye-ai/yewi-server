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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const anti_fraud_utils_1 = require("../../common/utils/anti-fraud.utils");
const prisma_service_1 = require("../../database/prisma.service");
let ChatService = class ChatService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findOrCreateConversation(userId, targetId) {
        let conversation = await this.prisma.conversation.findFirst({
            where: {
                OR: [
                    { id: targetId },
                    { orderId: targetId },
                    { serviceRequestId: targetId },
                ],
            },
        });
        if (!conversation) {
            const order = await this.prisma.order.findUnique({
                where: { id: targetId },
                include: { professionalProfile: true },
            });
            if (order) {
                if (order.clientId !== userId &&
                    order.professionalProfile.userId !== userId) {
                    throw new common_1.ForbiddenException('No autorizado en este pedido');
                }
                conversation = await this.prisma.conversation.create({
                    data: {
                        orderId: order.id,
                        participantAId: order.clientId,
                        participantBId: order.professionalProfile.userId,
                    },
                });
            }
        }
        return conversation;
    }
    async getMyConversations(userId) {
        return this.prisma.conversation.findMany({
            where: {
                OR: [{ participantAId: userId }, { participantBId: userId }],
            },
            include: {
                order: {
                    select: {
                        id: true,
                        orderNumber: true,
                        status: true,
                    },
                },
                serviceRequest: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async getMessages(userId, conversationOrOrderId) {
        const conversation = await this.findOrCreateConversation(userId, conversationOrOrderId);
        if (!conversation) {
            throw new common_1.NotFoundException('Conversación no encontrada');
        }
        if (conversation.participantAId !== userId &&
            conversation.participantBId !== userId) {
            throw new common_1.ForbiddenException('No tienes acceso a esta conversación');
        }
        await this.prisma.message.updateMany({
            where: {
                conversationId: conversation.id,
                senderId: { not: userId },
                isRead: false,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
        const messages = await this.prisma.message.findMany({
            where: { conversationId: conversation.id },
            include: {
                sender: {
                    select: {
                        id: true,
                        profile: {
                            select: {
                                firstName: true,
                                lastName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        return {
            conversationId: conversation.id,
            orderId: conversation.orderId,
            messages,
        };
    }
    async sendMessage(userId, dto) {
        const conversation = await this.findOrCreateConversation(userId, dto.conversationId);
        if (!conversation) {
            throw new common_1.NotFoundException('Conversación no encontrada');
        }
        if (conversation.participantAId !== userId &&
            conversation.participantBId !== userId) {
            throw new common_1.ForbiddenException('No autorizado en esta conversación');
        }
        let content = dto.content;
        const isOrderActive = conversation.orderId &&
            conversation.orderId.length > 0;
        if (!isOrderActive) {
            content = anti_fraud_utils_1.AntiFraudUtils.sanitizeText(content);
        }
        const message = await this.prisma.message.create({
            data: {
                conversationId: conversation.id,
                senderId: userId,
                type: dto.type,
                content,
                attachments: dto.attachments ?? [],
                metadata: dto.metadata,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        profile: {
                            select: {
                                firstName: true,
                                lastName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
        });
        await this.prisma.conversation.update({
            where: { id: conversation.id },
            data: {
                lastMessageAt: new Date(),
            },
        });
        return message;
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatService);
//# sourceMappingURL=chat.service.js.map