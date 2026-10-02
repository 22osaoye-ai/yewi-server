import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from './apiClient';
import { SAMPLE_PROFESSIONALS } from '@/constants/sampleData';

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrls?: string[];
  projectUrl?: string | null;
  tags?: string[];
  createdAt?: string;
}

export interface ProfessionalDetail {
  id: string;
  businessName?: string | null;
  bio?: string | null;
  taxId?: string | null;
  hourlyRate?: number | null;
  serviceRadiusKm?: number;
  city?: string | null;
  province?: string | null;
  region?: string | null;
  address?: string | null;
  postalCode?: string | null;
  country?: string | null;

  avgRating?: number;
  totalReviews?: number;
  completedOrdersCount?: number;
  skills?: string[];
  badges?: string[];
  isPro?: boolean;
  user?: {
    id?: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      displayName?: string;
      avatarUrl?: string | null;
      city?: string | null;
      province?: string | null;
    } | null;
  } | null;
  categories?: { id?: string; name?: string; slug?: string; icon?: string }[];
  portfolioItems?: PortfolioItem[];
  gigs?: { id: string; title: string; description: string; coverImages?: string[] }[];
}

export interface SearchProfessionalsResponse {
  items: ProfessionalDetail[];
  total: number;
  limit: number;
  offset: number;
}

export interface SearchProfessionalsFilters {
  q?: string;
  category?: string;
  city?: string;
  province?: string;
  skill?: string;
  limit?: number;
  offset?: number;
}

export interface UpdateProfessionalProfilePayload {
  businessName?: string;
  bio?: string;
  hourlyRate?: number;
  serviceRadiusKm?: number;
  skills?: string[];
  categoryIds?: string[];
  city?: string;
  postalCode?: string;
  address?: string;
  country?: string;
  region?: string;
  province?: string;
  taxId?: string;
}

export interface CreatePortfolioItemPayload {
  title: string;
  description: string;
  imageUrls?: string[];
  projectUrl?: string;
  tags?: string[];
}

const STORAGE_PROFESSIONALS_KEY = '@yewi_cache_professionals_all';
let inMemoryProfessionalsCache: ProfessionalDetail[] | null = null;

export const professionalsApi = {
  async getCachedProfessionals(): Promise<ProfessionalDetail[]> {
    if (inMemoryProfessionalsCache && inMemoryProfessionalsCache.length > 0) {
      return inMemoryProfessionalsCache;
    }
    try {
      const stored = await AsyncStorage.getItem(STORAGE_PROFESSIONALS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryProfessionalsCache = parsed;
          return parsed;
        }
      }
    } catch {}
    return SAMPLE_PROFESSIONALS;
  },

  async searchProfessionals(filters: SearchProfessionalsFilters = {}): Promise<SearchProfessionalsResponse> {
    const params = new URLSearchParams();
    if (filters.q) params.append('q', filters.q);
    if (filters.category) params.append('category', filters.category);
    if (filters.city) params.append('city', filters.city);
    if (filters.province) params.append('province', filters.province);
    if (filters.skill) params.append('skill', filters.skill);
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.offset) params.append('offset', String(filters.offset));

    const queryString = params.toString();
    const endpoint = `/professionals${queryString ? `?${queryString}` : ''}`;
    try {
      const res = await apiRequest<SearchProfessionalsResponse>(endpoint, {
        method: 'GET',
        timeoutMs: 7000,
      });

      if (res?.items && Array.isArray(res.items) && res.items.length > 0) {
        if (!filters.q && !filters.category && !filters.city && !filters.skill) {
          inMemoryProfessionalsCache = res.items;
          AsyncStorage.setItem(STORAGE_PROFESSIONALS_KEY, JSON.stringify(res.items)).catch(() => {});
        }
      }
      return res;
    } catch (err) {
      const fallbackItems = await this.getCachedProfessionals();
      return {
        items: fallbackItems,
        total: fallbackItems.length,
        limit: filters.limit || 50,
        offset: filters.offset || 0,
      };
    }
  },

  async getPublicProfile(id: string) {
    return apiRequest<ProfessionalDetail>(`/professionals/${encodeURIComponent(id)}`, {
      method: 'GET',
    });
  },

  async getMyProfile() {
    return apiRequest<ProfessionalDetail>('/professionals/me', { method: 'GET' });
  },

  async updateMyProfile(dto: UpdateProfessionalProfilePayload) {
    return apiRequest<ProfessionalDetail>('/professionals/me', {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async addPortfolioItem(payload: CreatePortfolioItemPayload) {
    return apiRequest<PortfolioItem>('/professionals/me/portfolio', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deletePortfolioItem(itemId: string) {
    return apiRequest<{ message: string }>(`/professionals/me/portfolio/${encodeURIComponent(itemId)}`, {
      method: 'DELETE',
    });
  },

  async uploadPortfolioImage(imageBase64OrUri: string) {
    return apiRequest<{ url: string; publicId?: string; warning?: string }>('/professionals/me/portfolio/upload', {
      method: 'POST',
      body: JSON.stringify({ image: imageBase64OrUri }),
    });
  },
};

