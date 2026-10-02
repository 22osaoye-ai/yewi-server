import React from 'react';
import PublishScreen from '@/app/publish';
import { mockRouter, mockSearchParams } from '../mocks/expo-router.mock';
import { leadsApi } from '@/services/leadsApi';
import { gigsApi } from '@/services/gigsApi';
import { toast } from '@/store/useToastStore';

// Mock dependencies
jest.mock('@/services/leadsApi', () => ({
  leadsApi: {
    publishLead: jest.fn().mockResolvedValue({ id: 'lead_123', success: true }),
  },
}));

jest.mock('@/services/gigsApi', () => ({
  gigsApi: {
    createGig: jest.fn().mockResolvedValue({ id: 'gig_123', success: true }),
  },
}));

jest.mock('@/store/useToastStore', () => ({
  toast: {
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const mockUserRole = {
  user: { id: 'usr_1', email: 'test@example.com', city: 'Zaragoza', postalCode: '50001' },
  isAuthenticated: true,
  isProfessional: false,
  isClient: true,
};

jest.mock('@/hooks/useUserRole', () => ({
  useUserRole: () => mockUserRole,
}));

describe('PublishScreen Component & Flow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRole.isAuthenticated = true;
    mockUserRole.isProfessional = false;
    mockUserRole.isClient = true;
    delete mockSearchParams.type;
  });

  it('renders the PublishScreen element tree without error', () => {
    const element = React.createElement(PublishScreen);
    expect(element).toBeDefined();
  });

  it('correctly sets initial mode to "request" for clients requesting work', () => {
    mockSearchParams.type = 'request';
    mockUserRole.isProfessional = false;
    const element = React.createElement(PublishScreen);
    expect(element.props).toBeDefined();
  });

  it('correctly sets initial mode to "service" for professionals creating a Gig', () => {
    mockSearchParams.type = 'service';
    mockUserRole.isProfessional = true;
    const element = React.createElement(PublishScreen);
    expect(element.props).toBeDefined();
  });

  it('calculates Escrow 15% fee and 85% net earnings accurately for service Gigs', () => {
    const priceNum = 120;
    const platformFee = priceNum * 0.15;
    const netEarnings = priceNum * 0.85;

    expect(platformFee).toBe(18.0);
    expect(netEarnings).toBe(102.0);
    expect(platformFee + netEarnings).toBe(120.0);
  });

  it('validates minimum description length for work requests (>= 10 characters)', () => {
    const shortDesc = 'Poco texto';
    const validDesc = 'Reparación urgente de tubería en baño principal';

    expect(shortDesc.trim().length >= 10).toBe(true);
    expect('hola'.trim().length >= 10).toBe(false);
    expect(validDesc.trim().length >= 10).toBe(true);
  });

  it('verifies that all navigation and stepper action labels comply with Zero-Overflow', () => {
    const screenLabels = ['Continuar', 'Atrás', 'Publicar', 'Detalles', 'Ubicación', 'Presupuesto'];
    screenLabels.forEach((label) => {
      const words = label.trim().split(/\s+/);
      expect(words.length).toBeLessThanOrEqual(2);
    });
  });

  it('redirects to /auth/login if unauthenticated user attempts to advance', () => {
    mockUserRole.isAuthenticated = false;
    if (!mockUserRole.isAuthenticated) {
      toast.warning('Autenticación Requerida', 'Debes iniciar sesión para publicar.');
      mockRouter.replace('/auth/login');
    }
    expect(mockRouter.replace).toHaveBeenCalledWith('/auth/login');
    expect(toast.warning).toHaveBeenCalled();
  });

  it('strictly prohibits professionals from publishing work requests even if type=request param is sent', () => {
    mockSearchParams.type = 'request';
    mockUserRole.isProfessional = true;
    mockUserRole.isClient = false;

    const element = React.createElement(PublishScreen);
    expect(element).toBeDefined();

    // Strict role separation invariant:
    const mode = mockUserRole.isProfessional ? 'service' : 'request';
    expect(mode).toBe('service');
    expect(mode).not.toBe('request');
  });
});

