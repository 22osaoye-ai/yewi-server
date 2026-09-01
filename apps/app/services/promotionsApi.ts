import { apiRequest } from './apiClient';

export interface SellerPromotion {
  id: string;
  title: string;
  description: string;
  discountPercent?: number | null;
  discountAmount?: number | null;
  promoCode?: string | null;
  category?: string | null;
  badge?: string | null;
  expiresAt: string;
  createdAt: string;
  professional?: {
    id: string;
    userId: string;
    name: string;
    avatarUrl?: string | null;
    city?: string | null;
    avgRating?: number;
    totalReviews?: number;
    isPro?: boolean;
  };
}

export interface CreatePromotionPayload {
  title: string;
  description: string;
  discountPercent?: number;
  discountAmount?: number;
  promoCode?: string;
  category?: string;
  badge?: string;
  expiresAt: string;
}

export const promotionsApi = {
  /**
   * Obtener promociones activas de vendedores
   */
  async getActivePromotions(category?: string): Promise<SellerPromotion[]> {
    const endpoint = `/promotions${category ? `?category=${encodeURIComponent(category)}` : ''}`;
    return apiRequest<SellerPromotion[]>(endpoint, {
      method: 'GET',
    });
  },

  /**
   * Crear una nueva promoción por tiempo limitado (Solo profesionales / Sellers)
   */
  async createPromotion(dto: CreatePromotionPayload): Promise<SellerPromotion> {
    return apiRequest<SellerPromotion>('/promotions', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Obtener promociones creadas por el profesional autenticado
   */
  async getMyPromotions(): Promise<SellerPromotion[]> {
    return apiRequest<SellerPromotion[]>('/promotions/my-promotions', {
      method: 'GET',
    });
  },

  /**
   * Eliminar una promoción propia
   */
  async deletePromotion(id: string): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/promotions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
