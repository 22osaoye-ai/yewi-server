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
  // 0. Crear sesión de Stripe Checkout para pagar con tarjeta y retener en Escrow
  async createGigCheckoutSession(data: {
    gigPackageId: string;
    gigId?: string;
    extraIds?: string[];
    requirementsAnswers?: Record<string, any>;
  }): Promise<{ url: string; sessionId: string }> {
    return apiRequest<{ url: string; sessionId: string }>('/orders/gig/checkout-session', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 1. Confirmar sesión de Stripe Checkout completada y materializar pedido
  async confirmGigCheckoutSession(sessionId: string): Promise<any> {
    return apiRequest<any>('/orders/gig/confirm-checkout', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  },

  // 2. Comprar servicio descontando de saldo disponible de billetera con custodia Escrow
  async createGigOrder(data: {
    gigPackageId: string;
    gigId?: string;
    extraIds?: string[];
    requirementsAnswers?: Record<string, any>;
  }): Promise<any> {
    return apiRequest<any>('/orders/gig', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 1. Obtener mis pedidos y pagos en custodia
  async getMyOrders(role?: 'client' | 'pro'): Promise<OrderItem[]> {
    const query = role ? `?role=${role}` : '';
    return apiRequest<OrderItem[]>(`/orders${query}`, {
      method: 'GET',
    });
  },

  // 2. Ver detalle completo de un pedido
  async getOrderById(orderId: string): Promise<OrderItem | any> {
    return apiRequest<OrderItem | any>(`/orders/${orderId}`, {
      method: 'GET',
    });
  },

  // 3. Entregar trabajo final con mensaje y fotos (Profesional)
  async submitDelivery(orderId: string, data: { message: string; attachmentUrls?: string[] }): Promise<any> {
    return apiRequest<any>(`/orders/${orderId}/deliveries`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 4. Aprobar trabajo y liberar fondos de Escrow al profesional (Cliente)
  async approveDelivery(orderId: string): Promise<any> {
    return apiRequest<any>(`/orders/${orderId}/approve`, {
      method: 'POST',
    });
  },

  // 5. Solicitar revisión sobre una entrega (Cliente)
  async requestRevision(orderId: string, revisionNotes: string): Promise<any> {
    return apiRequest<any>(`/orders/${orderId}/revisions`, {
      method: 'POST',
      body: JSON.stringify({ revisionNotes }),
    });
  },

  // 6. Cancelar pedido y reembolsar fondos de Escrow al cliente
  async cancelOrder(orderId: string, reason?: string): Promise<any> {
    return apiRequest<any>(`/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};
