import { apiRequest } from './apiClient';

export interface StatusCommentItem {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  createdAt: string;
}

export interface StatusItem {
  id: string;
  authorId: string;
  mediaUrl: string | null;
  mediaType: 'IMAGE' | 'VIDEO' | 'TEXT';
  caption: string | null;
  backgroundColor: string | null;
  viewCount: number;
  expiresAt: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLikedByMe: boolean;
  myReaction: string | null;
  comments: StatusCommentItem[];
}

export interface AuthorStatusFeedGroup {
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  businessName: string | null;
  isPro: boolean;
  category: string | null;
  hasUnseen: boolean;
  latestStatusCreatedAt: string;
  statuses: StatusItem[];
}

export interface CreateStatusPayload {
  mediaUrl?: string;
  mediaType?: 'IMAGE' | 'VIDEO' | 'TEXT';
  caption?: string;
  backgroundColor?: string;
}

export const statusesApi = {
  // 1. Obtener feed de estados agrupados por autor
  async getFeed(): Promise<AuthorStatusFeedGroup[]> {
    return apiRequest<AuthorStatusFeedGroup[]>('/statuses/feed', {
      method: 'GET',
    });
  },

  // 2. Publicar nuevo estado (Solo Yewi Pro)
  async createStatus(payload: CreateStatusPayload): Promise<any> {
    return apiRequest<any>('/statuses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // 3. Obtener detalle de un estado por ID
  async getStatusById(statusId: string): Promise<StatusItem> {
    return apiRequest<StatusItem>(`/statuses/${statusId}`, {
      method: 'GET',
    });
  },

  // 4. Comentar un estado
  async addComment(statusId: string, content: string): Promise<StatusCommentItem> {
    return apiRequest<StatusCommentItem>(`/statuses/${statusId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  // 5. Reaccionar / dar like a un estado
  async reactToStatus(statusId: string, reactionType = 'LIKE'): Promise<{ reacted: boolean; reactionType: string | null }> {
    return apiRequest<{ reacted: boolean; reactionType: string | null }>(`/statuses/${statusId}/react`, {
      method: 'POST',
      body: JSON.stringify({ reactionType }),
    });
  },

  // 6. Eliminar estado propio
  async deleteStatus(statusId: string): Promise<void> {
    return apiRequest<void>(`/statuses/${statusId}`, {
      method: 'DELETE',
    });
  },
};
