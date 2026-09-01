import { apiRequest } from './apiClient';

export interface OrderItem {
  id: string;
  clientId: string;
  professionalId: string;
  orderNumber: string;
  type: string;
  status: string;
  totalPrice: number;
  currency: string;
  escrowStatus: string;
  createdAt: string;
  updatedAt: string;
}

export const ordersApi = {
  // 1. Obtener mis pedidos y pagos en custodia
  async getMyOrders(role?: 'client' | 'pro'): Promise<OrderItem[]> {
    const query = role ? `?role=${role}` : '';
    return apiRequest<OrderItem[]>(`/orders${query}`, {
      method: 'GET',
    });
  },

  // 2. Crear un pedido y depositar fondos en custodia
  async createGigOrder(data: {
    gigId: string;
    packageId: string;
    requirements?: string;
  }): Promise<OrderItem> {
    return apiRequest<OrderItem>('/orders/gig', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
