import { apiRequest } from './apiClient';

export interface ServiceRequestItem {
  id: string;
  clientId: string;
  categoryId?: string;
  category?: any;
  title: string;
  description: string;
  budgetEstimated?: number;
  budgetMin?: number;
  budgetMax?: number;
  city: string;
  postalCode?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'FULFILLED' | 'COMPLETED' | 'CANCELLED';
  proposalsCount?: number;
  orders?: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    deliveryDeadline?: string;
    professionalProfile?: {
      id: string;
      businessName?: string;
      user?: {
        id: string;
        profile?: {
          displayName?: string;
          firstName?: string;
          lastName?: string;
          avatarUrl?: string;
          phoneNumber?: string;
        };
      };
    };
  }>;
  proposals?: Array<{
    id: string;
    professionalProfileId?: string;
    professionalId?: string;
    price: number;
    message?: string;
    description?: string;
    estimatedDays?: number;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    createdAt: string;
    professionalProfile?: {
      id: string;
      businessName?: string;
      user?: {
        id: string;
        profile?: {
          displayName?: string;
          firstName?: string;
          lastName?: string;
          avatarUrl?: string;
          phoneNumber?: string;
        };
      };
    };
  }>;
  createdAt: string;
  updatedAt: string;
  isUnlockedByMe?: boolean;
  myProposal?: QuoteProposalItem | null;
  activeOrder?: any | null;
  isAssignedToMe?: boolean;
}

export interface QuoteProposalItem {
  id: string;
  serviceRequestId: string;
  professionalProfileId?: string;
  price: number;
  estimatedDays?: number;
  message?: string;
  description?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'WITHDRAWN';
  createdAt: string;
  updatedAt?: string;
  conversationId?: string | null;
  order?: {
    id: string;
    orderNumber: string;
    status: string;
    escrowStatus: string;
    totalAmount: number;
    deliveryDeadline?: string;
  } | null;
  client?: {
    id: string;
    name: string;
    avatarUrl?: string;
    phone?: string;
    email?: string;
    city?: string;
    address?: string;
  };
  serviceRequest?: {
    id: string;
    title: string;
    description: string;
    city: string;
    postalCode?: string;
    status: string;
    category?: {
      id?: string;
      name: string;
      slug?: string;
    };
  };
  professionalProfile?: {
    id: string;
    businessName?: string;
    user?: {
      id: string;
      profile?: {
        displayName?: string;
        firstName?: string;
        lastName?: string;
        avatarUrl?: string;
        phoneNumber?: string;
      };
    };
  };
}

export interface CreateServiceRequestInput {
  categoryId?: string;
  category?: string;
  title: string;
  description: string;
  questionnaireAnswers?: Record<string, any>;
  budgetEstimated?: number;
  budgetMin?: number;
  budgetMax?: number;
  city: string;
  postalCode?: string;
  address?: string;
  isUrgent?: boolean;
}

export const leadsApi = {
  // 1. Publicar una nueva solicitud de servicio / trabajo
  async createRequest(data: CreateServiceRequestInput): Promise<ServiceRequestItem> {
    return apiRequest<ServiceRequestItem>('/leads/requests', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        categoryId: data.categoryId || data.category || 'Electricidad',
        category: data.category || data.categoryId || 'Electricidad',
        questionnaireAnswers: data.questionnaireAnswers || {},
        budgetEstimated: data.budgetEstimated,
        budgetMax: data.budgetMax || data.budgetEstimated,
        city: data.city || 'Zaragoza',
        postalCode: data.postalCode || '50001',
      }),
    });
  },

  // 2. Ver mis solicitudes publicadas como cliente
  async getMyRequests(): Promise<ServiceRequestItem[]> {
    return apiRequest<ServiceRequestItem[]>('/leads/my-requests', {
      method: 'GET',
    });
  },

  // 3. Ver feed de solicitudes abiertas en la zona (para sellers/profesionales)
  async getAvailableLeads(filters?: { category?: string; city?: string }): Promise<ServiceRequestItem[]> {
    const query = new URLSearchParams();
    if (filters?.category) query.append('category', filters.category);
    if (filters?.city) query.append('city', filters.city);
    const queryString = query.toString() ? `?${query.toString()}` : '';

    return apiRequest<ServiceRequestItem[]>(`/leads/opportunities${queryString}`, {
      method: 'GET',
    });
  },

  // 4. Enviar propuesta / presupuesto a una solicitud (para sellers)
  async sendQuoteProposal(
    requestId: string,
    data: { price: number; description?: string; message?: string; estimatedDays?: number }
  ): Promise<any> {
    return apiRequest(`/leads/requests/${requestId}/proposals`, {
      method: 'POST',
      body: JSON.stringify({
        price: data.price,
        estimatedDays: data.estimatedDays || 3,
        message: data.message || data.description || 'Presupuesto de servicio profesional',
      }),
    });
  },

  // 5. Aceptar un presupuesto recibido (para clientes)
  async acceptProposal(proposalId: string): Promise<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    conversationId?: string;
    [key: string]: any;
  }> {
    return apiRequest<{
      id: string;
      orderNumber: string;
      status: string;
      totalAmount: number;
      conversationId?: string;
      [key: string]: any;
    }>(`/leads/proposals/${proposalId}/accept`, {
      method: 'POST',
    });
  },

  // 6. Ver todos mis presupuestos enviados y su estado (para sellers/profesionales)
  async getMyProposals(): Promise<QuoteProposalItem[]> {
    return apiRequest<QuoteProposalItem[]>('/leads/my-proposals', {
      method: 'GET',
    });
  },

  // 7. Desbloquear contacto de un lead para profesionales con Yewi Pro.
  // La suscripción sustituye cualquier flujo de créditos.
  async unlockLead(requestId: string): Promise<any> {
    return apiRequest(`/leads/requests/${requestId}/unlock`, {
      method: 'POST',
    });
  },

  // 8. Eliminar / Cancelar una solicitud de servicio (para el cliente creador)
  async deleteRequest(requestId: string): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/leads/requests/${requestId}`, {
      method: 'DELETE',
    });
  },

  // 9. Obtener detalle de una solicitud por ID
  async getRequestById(requestId: string): Promise<ServiceRequestItem> {
    return apiRequest<ServiceRequestItem>(`/leads/requests/${requestId}`, {
      method: 'GET',
    });
  },
};

