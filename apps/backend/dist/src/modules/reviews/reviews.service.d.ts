import { PrismaService } from '../../database/prisma.service';
import { CreateReviewDto, ReplyReviewDto } from './dto/create-review.dto';
export declare class ReviewsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createReview(userId: string, dto: CreateReviewDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        gigId: string | null;
        orderId: string;
        rating: number;
        qualityRating: number;
        communicationRating: number;
        deliveryRating: number;
        comment: string;
        authorId: string;
        targetUserId: string;
        sellerReply: string | null;
        sellerRepliedAt: Date | null;
    }>;
    replyToReview(userId: string, reviewId: string, dto: ReplyReviewDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        gigId: string | null;
        orderId: string;
        rating: number;
        qualityRating: number;
        communicationRating: number;
        deliveryRating: number;
        comment: string;
        authorId: string;
        targetUserId: string;
        sellerReply: string | null;
        sellerRepliedAt: Date | null;
    }>;
    getReviewsByTargetUser(targetUserId: string): Promise<({
        author: {
            profile: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                firstName: string;
                lastName: string;
                displayName: string | null;
                avatarUrl: string | null;
                phoneNumber: string | null;
                phoneVerified: boolean;
                country: string | null;
                city: string | null;
                postalCode: string | null;
                address: string | null;
                bio: string | null;
                preferredLanguage: string;
                userId: string;
            } | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        gigId: string | null;
        orderId: string;
        rating: number;
        qualityRating: number;
        communicationRating: number;
        deliveryRating: number;
        comment: string;
        authorId: string;
        targetUserId: string;
        sellerReply: string | null;
        sellerRepliedAt: Date | null;
    })[]>;
}
