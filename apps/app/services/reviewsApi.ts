import { apiRequest } from './apiClient';

export interface ReviewAuthor {
  id?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    avatarUrl?: string | null;
  } | null;
}

export interface ReviewItem {
  id: string;
  orderId?: string | null;
  professionalProfileId?: string | null;
  gigId?: string | null;
  authorId: string;
  targetUserId: string;
  rating: number;
  qualityRating?: number;
  communicationRating?: number;
  deliveryRating?: number;
  comment: string;
  sellerReply?: string | null;
  sellerRepliedAt?: string | null;
  createdAt: string;
  author?: ReviewAuthor;
}

export interface CreateReviewPayload {
  orderId?: string;
  professionalProfileId?: string;
  rating: number;
  qualityRating?: number;
  communicationRating?: number;
  deliveryRating?: number;
  comment: string;
}

export interface ReplyReviewPayload {
  reply: string;
}

export const reviewsApi = {
  async getReviewsByProfessional(professionalId: string) {
    return apiRequest<ReviewItem[]>(`/reviews/professional/${encodeURIComponent(professionalId)}`, {
      method: 'GET',
    });
  },

  async getReviewsByUser(userId: string) {
    return apiRequest<ReviewItem[]>(`/reviews/user/${encodeURIComponent(userId)}`, {
      method: 'GET',
    });
  },

  async createReview(payload: CreateReviewPayload) {
    return apiRequest<ReviewItem>('/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async replyToReview(reviewId: string, payload: ReplyReviewPayload) {
    return apiRequest<ReviewItem>(`/reviews/${encodeURIComponent(reviewId)}/reply`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
