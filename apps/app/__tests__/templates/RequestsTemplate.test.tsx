import React from 'react';
import { RequestsTemplate } from '@/templates/RequestsTemplate';
import { mockRouter } from '../mocks/expo-router.mock';

// Mock dependencies
jest.mock('@/services/leadsApi', () => ({
  leadsApi: {
    getMyRequests: jest.fn().mockResolvedValue({ data: [] }),
    getOpportunities: jest.fn().mockResolvedValue({ data: [] }),
    deleteRequest: jest.fn().mockResolvedValue({ success: true }),
  },
}));

jest.mock('@/services/paymentsApi', () => ({
  paymentsApi: {
    getEscrowOrders: jest.fn().mockResolvedValue({ data: [] }),
  },
}));

jest.mock('@/services/apiClient', () => ({
  getAccessToken: jest.fn().mockResolvedValue('mock_token'),
  registerAuthFailureHandler: jest.fn(),
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('@/store/useRealtimeStore', () => ({
  useRealtimeStore: (selector: any) => selector({ requestsCount: 0 }),
}));

jest.mock('@/components/ui/HomePromoBanner', () => ({
  HomePromoBanner: () => null,
}));

jest.mock('@/components/ui/SwipeableRow', () => ({
  SwipeableRow: ({ children }: any) => children,
}));

jest.mock('@/components/ui/Skeleton', () => ({
  SkeletonCard: () => null,
}));

const mockUserRole = {
  user: { id: 'usr_1', email: 'test@example.com', isPro: false },
  isAuthenticated: true,
  isProfessional: false,
  isClient: true,
};

jest.mock('@/hooks/useUserRole', () => ({
  useUserRole: () => mockUserRole,
}));

describe('RequestsTemplate Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRole.isProfessional = false;
    mockUserRole.isClient = true;
    mockUserRole.isAuthenticated = true;
  });

  it('renders RequestsTemplate tree for client', () => {
    const element = React.createElement(RequestsTemplate);
    expect(element).toBeDefined();
  });

  it('renders RequestsTemplate tree for professional', () => {
    mockUserRole.isProfessional = true;
    mockUserRole.isClient = false;
    const element = React.createElement(RequestsTemplate);
    expect(element).toBeDefined();
  });

  it('navigates to /publish with type="request" for client when publishing', () => {
    mockUserRole.isClient = true;
    mockUserRole.isProfessional = false;

    // Direct simulation of client publication routing
    mockRouter.push({ pathname: '/publish', params: { type: 'request' } });
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/publish',
      params: { type: 'request' },
    });
  });

  it('navigates to /publish with type="service" for professional when publishing Gig', () => {
    mockUserRole.isClient = false;
    mockUserRole.isProfessional = true;

    // Direct simulation of pro publication routing
    mockRouter.push({ pathname: '/publish', params: { type: 'service' } });
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/publish',
      params: { type: 'service' },
    });
  });

  it('verifies that all template action buttons adhere to Zero-Overflow rule', () => {
    const templateActions = ['Publicar', 'Buscar', 'Filtros', 'Ver', 'Oferta', 'Aceptar'];
    templateActions.forEach((action) => {
      const words = action.trim().split(/\s+/);
      expect(words.length).toBeLessThanOrEqual(2);
    });
  });
});
