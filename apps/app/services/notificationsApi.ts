import { apiRequest } from './apiClient';

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export const notificationsApi = {
  // 1. Obtener todas mis notificaciones
  async getMyNotifications(): Promise<NotificationItem[]> {
    return apiRequest<NotificationItem[]>('/notifications', {
      method: 'GET',
    });
  },

  // 2. Obtener contador de notificaciones no leídas
  async getUnreadCount(): Promise<{ unreadCount: number }> {
    return apiRequest<{ unreadCount: number }>('/notifications/unread-count', {
      method: 'GET',
    });
  },

  // 3. Marcar una notificación individual como leída
  async markAsRead(id: string): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  // 4. Marcar todas las notificaciones como leídas
  async markAllAsRead(): Promise<{ success: boolean; count: number }> {
    return apiRequest<{ success: boolean; count: number }>('/notifications/read-all', {
      method: 'PATCH',
    });
  },

  // 5. Eliminar una notificación individual
  async deleteNotification(id: string): Promise<{ success: boolean; count: number }> {
    return apiRequest<{ success: boolean; count: number }>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },

  // 6. Eliminar múltiples notificaciones por lote
  async deleteBatch(ids: string[]): Promise<{ success: boolean; count: number }> {
    return apiRequest<{ success: boolean; count: number }>('/notifications/batch', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
  },

  // 7. Eliminar todas las notificaciones
  async deleteAll(): Promise<{ success: boolean; count: number }> {
    return apiRequest<{ success: boolean; count: number }>('/notifications/clear-all', {
      method: 'DELETE',
    });
  },
};

