import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from './apiClient';
import { SAMPLE_PROJECTS } from '@/constants/sampleData';

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
  packages?: Array<{
    tier: string;
    name: string;
    description: string;
    price: number;
    deliveryDays: number;
    revisions: number;
    features?: any;
    isPopular?: boolean;
  }>;
}

const STORAGE_GIGS_KEY = '@yewi_cache_gigs_all';
let inMemoryGigsCache: GigDetail[] | null = null;

export const gigsApi = {
  getById(id: string) {
    return apiRequest<GigDetail>(`/gigs/${encodeURIComponent(id)}`, { method: 'GET' });
  },

  async getCachedGigs(): Promise<GigDetail[]> {
    if (inMemoryGigsCache && inMemoryGigsCache.length > 0) {
      return inMemoryGigsCache;
    }
    try {
      const stored = await AsyncStorage.getItem(STORAGE_GIGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryGigsCache = parsed;
          return parsed;
        }
      }
    } catch {}
    return SAMPLE_PROJECTS;
  },

  async getAll(params?: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    deliveryDays?: number;
    limit?: number;
    page?: number;
  }): Promise<GigDetail[]> {
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

    try {
      const res = await apiRequest<any>(endpoint, { method: 'GET', timeoutMs: 7000 });
      let items: GigDetail[] = [];
      if (Array.isArray(res)) {
        items = res;
      } else if (res && Array.isArray(res.data)) {
        items = res.data;
      }

      if (items.length > 0 && (!params || (!params.category && !params.search))) {
        inMemoryGigsCache = items;
        AsyncStorage.setItem(STORAGE_GIGS_KEY, JSON.stringify(items)).catch(() => {});
      }

      return items;
    } catch (err) {
      // Return cached/sample items if general listing to avoid empty UI
      if (!params || (!params.category && !params.search)) {
        return this.getCachedGigs();
      }
      return [];
    }
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

  update(id: string, data: Partial<CreateProjectPayload>) {
    return apiRequest<GigDetail>(`/gigs/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: string) {
    return apiRequest<{ message: string }>(`/gigs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
