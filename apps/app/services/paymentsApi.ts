import { apiRequest } from './apiClient';

export interface PaymentIntentResponse {
  clientSecret: string | null;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
}

export interface SubscriptionStatusResponse {
  isPro: boolean;
  plan: string;
  priceEur: number;
  interval: string;
  paymentMethod?: {
    brand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
  } | null;
  subscription: {
    id: string;
    status: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
}

export const paymentsApi = {
  // 1. Crear intención de pago con Stripe para retener fondos en depósito de custodia (Escrow)
  async createPaymentIntent(params: {
    amount: number;
    currency?: string;
    paymentType?: string;
    referenceId?: string;
  }): Promise<PaymentIntentResponse> {
    return apiRequest<PaymentIntentResponse>('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency || 'EUR',
        paymentType: params.paymentType || 'ORDER_PAYMENT',
        referenceId: params.referenceId,
      }),
    });
  },

  // 2. Obtener estado de la suscripción Yewi Pro
  async getSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
    return apiRequest<SubscriptionStatusResponse>('/payments/subscription', {
      method: 'GET',
    });
  },

  // 3. Forzar sincronización en vivo con Stripe
  async syncSubscription(): Promise<SubscriptionStatusResponse> {
    return apiRequest<SubscriptionStatusResponse>('/payments/subscription/sync', {
      method: 'POST',
    });
  },

  // 4. Cancelar renovación automática in-app sin salir a Stripe
  async cancelSubscriptionAutoRenew(): Promise<{
    success: boolean;
    message: string;
    cancelAtPeriodEnd: boolean;
  }> {
    return apiRequest<{
      success: boolean;
      message: string;
      cancelAtPeriodEnd: boolean;
    }>('/payments/subscription/cancel', {
      method: 'POST',
    });
  },

  // 5. Reanudar renovación automática in-app
  async resumeSubscriptionAutoRenew(): Promise<{
    success: boolean;
    message: string;
    cancelAtPeriodEnd: boolean;
  }> {
    return apiRequest<{
      success: boolean;
      message: string;
      cancelAtPeriodEnd: boolean;
    }>('/payments/subscription/resume', {
      method: 'POST',
    });
  },

  // 6. Crear sesión de Stripe Checkout para suscribirse a Yewi Pro (9,99 €/mes)
  async createSubscriptionCheckout(): Promise<{ url: string; sessionId: string }> {
    return apiRequest<{ url: string; sessionId: string }>('/payments/subscription/checkout', {
      method: 'POST',
    });
  },

  // 7. Crear sesión del Customer Portal para gestionar/cancelar suscripción o descargar facturas
  async createCustomerPortalSession(): Promise<{ url: string }> {
    return apiRequest<{ url: string }>('/payments/subscription/portal', {
      method: 'POST',
    });
  },
};

