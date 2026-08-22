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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let ReviewsService = class ReviewsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createReview(userId, dto) {
        const order = await this.prisma.order.findUnique({
            where: { id: dto.orderId },
            include: {
                professionalProfile: true,
                review: true,
            },
        });
        if (!order) {
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        if (order.clientId !== userId) {
            throw new common_1.ForbiddenException('Solo el comprador puede dejar una reseña sobre el pedido');
        }
        if (order.status !== client_1.OrderStatus.COMPLETED) {
            throw new common_1.BadRequestException('Solo se pueden valorar pedidos que hayan sido completados');
        }
        if (order.review) {
            throw new common_1.ConflictException('Ya has valorado este pedido');
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
            const proReviews = await tx.review.findMany({
                where: { targetUserId: order.professionalProfile.userId },
                select: { rating: true },
            });
            const totalReviews = proReviews.length;
            const avgRating = Math.round((proReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) *
                10) / 10;
            await tx.professionalProfile.update({
                where: { id: order.professionalProfileId },
                data: {
                    avgRating,
                    totalReviews,
                },
            });
            if (order.gigId) {
                const gigReviews = await tx.review.findMany({
                    where: { gigId: order.gigId },
                    select: { rating: true },
                });
                const gigAvgRating = Math.round((gigReviews.reduce((sum, r) => sum + r.rating, 0) /
                    gigReviews.length) *
                    10) / 10;
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
    async replyToReview(userId, reviewId, dto) {
        const review = await this.prisma.review.findUnique({
            where: { id: reviewId },
        });
        if (!review) {
            throw new common_1.NotFoundException('Reseña no encontrada');
        }
        if (review.targetUserId !== userId) {
            throw new common_1.ForbiddenException('Solo el profesional valorado puede responder a esta reseña');
        }
        return this.prisma.review.update({
            where: { id: reviewId },
            data: {
                sellerReply: dto.reply,
                sellerRepliedAt: new Date(),
            },
        });
    }
    async getReviewsByTargetUser(targetUserId) {
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
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map