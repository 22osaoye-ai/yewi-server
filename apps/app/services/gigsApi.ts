import { apiRequest } from './apiClient';

export interface GigPackage {
  id: string;
  tier: string;
  name: string;
  description: string;
  price: number | string;
  deliveryDays: number;
  revisions: number;
  features?: unknown;
  isPopular?: boolean;
}

export interface GigDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImages?: string[];
  videoUrl?: string | null;
  faqs?: unknown;
  requirements?: string[];
  avgRating?: number;
  totalReviews?: number;
  category?: { name?: string } | null;
  packages: GigPackage[];
  extras?: { id: string; title: string; description?: string | null; price: number | string }[];
  professionalProfile?: {
    id: string;
    businessName?: string | null;
    bio?: string;
    city?: string | null;
    province?: string | null;
    avgRating?: number;
    totalReviews?: number;
    skills?: string[];
    isPro?: boolean;
    user?: { profile?: { displayName?: string; avatarUrl?: string | null } | null } | null;

    portfolioItems?: { id: string; title: string; description: string; imageUrls?: string[] }[];
  };
  reviews?: {
    id: string;
    rating: number;
    comment?: string | null;
    createdAt: string;
    author?: { profile?: { displayName?: string } | null } | null;
  }[];
}

export interface CreateProjectPayload {
  title: string;
  category?: string;
  categoryId?: string;
  description: string;
  price?: number;
  deliveryDays?: number;
  city?: string;
  coverImages?: string[];
  searchTags?: string[];
}

export const gigsApi = {
  getById(id: string) {
    return apiRequest<GigDetail>(`/gigs/${encodeURIComponent(id)}`, { method: 'GET' });
  },

  async getAll(params?: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    deliveryDays?: number;
    limit?: number;
    page?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.minPrice !== undefined) query.append('minPrice', String(params.minPrice));
    if (params?.maxPrice !== undefined) query.append('maxPrice', String(params.maxPrice));
    if (params?.deliveryDays !== undefined) query.append('deliveryDays', String(params.deliveryDays));
    if (params?.limit !== undefined) query.append('limit', String(params.limit));
    if (params?.page !== undefined) query.append('page', String(params.page));

    const qs = query.toString();
    const endpoint = `/gigs${qs ? `?${qs}` : ''}`;
    const res = await apiRequest<any>(endpoint, { method: 'GET' });
    if (Array.isArray(res)) {
      return res;
    }
    if (res && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  },

  getMyGigs() {
    return apiRequest<GigDetail[]>('/gigs/my-gigs', { method: 'GET' });
  },

  create(data: CreateProjectPayload) {
    return apiRequest<GigDetail>('/gigs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  delete(id: string) {
    return apiRequest<{ message: string }>(`/gigs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
