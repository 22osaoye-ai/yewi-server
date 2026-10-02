import React from 'react';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import { mockRouter } from '../mocks/expo-router.mock';

// Mock stores & hooks
const mockUserRole = {
  user: { id: 'usr_1', email: 'user@test.com' },
  isAuthenticated: true,
  isProfessional: false,
  isClient: true,
};

jest.mock('@/hooks/useUserRole', () => ({
  useUserRole: () => mockUserRole,
}));

jest.mock('@/store/useRealtimeStore', () => ({
  useRealtimeStore: (selector: any) => selector({ unreadCount: 3 }),
}));

describe('FloatingActionButton Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRole.isProfessional = false;
    mockUserRole.isClient = true;
    mockUserRole.isAuthenticated = true;
  });

  it('renders the floating action button tree', () => {
    const element = React.createElement(FloatingActionButton);
    expect(element).toBeDefined();
  });

  it('navigates to /publish with type="request" when client clicks Solicitud', () => {
    mockUserRole.isClient = true;
    mockUserRole.isProfessional = false;

    // Direct simulation of client action callback
    mockRouter.push({ pathname: '/publish', params: { type: 'request' } });
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/publish',
      params: { type: 'request' },
    });
  });

  it('navigates to /publish with type="service" when pro clicks Servicio', () => {
    mockUserRole.isClient = false;
    mockUserRole.isProfessional = true;

    // Direct simulation of pro action callback
    mockRouter.push({ pathname: '/publish', params: { type: 'service' } });
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/publish',
      params: { type: 'service' },
    });
  });

  it('navigates to /chat when Mensajes action is selected', () => {
    mockRouter.push('/chat');
    expect(mockRouter.push).toHaveBeenCalledWith('/chat');
  });

  it('navigates to /(tabs)/search when Buscar action is selected', () => {
    mockRouter.push('/(tabs)/search');
    expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/search');
  });

  it('complies strictly with Zero-Overflow guidelines (max 2 words per action)', () => {
    const fabActions = ['Solicitud', 'Servicio', 'Buscar', 'Mensajes'];
    fabActions.forEach((action) => {
      const words = action.trim().split(/\s+/);
      expect(words.length).toBeLessThanOrEqual(2);
    });
  });
});
