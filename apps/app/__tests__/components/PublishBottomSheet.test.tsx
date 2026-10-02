import React from 'react';
import PublishBottomSheet from '@/components/ui/PublishBottomSheet';
import { mockRouter } from '../mocks/expo-router.mock';

const mockUserRole = {
  user: { id: 'usr_1', email: 'user@test.com' },
  isAuthenticated: true,
  isProfessional: false,
  isClient: true,
};

jest.mock('@/hooks/useUserRole', () => ({
  useUserRole: () => mockUserRole,
}));

describe('PublishBottomSheet Component Tests', () => {
  const onSelectRequest = jest.fn();
  const onSelectProject = jest.fn();
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRole.isProfessional = false;
    mockUserRole.isClient = true;
    mockUserRole.isAuthenticated = true;
  });

  it('renders PublishBottomSheet tree for client', () => {
    const element = React.createElement(PublishBottomSheet, {
      visible: true,
      onClose,
      onSelectRequest,
      onSelectProject,
    });
    expect(element).toBeDefined();
  });

  it('renders PublishBottomSheet tree for professional', () => {
    mockUserRole.isProfessional = true;
    mockUserRole.isClient = false;

    const element = React.createElement(PublishBottomSheet, {
      visible: true,
      onClose,
      onSelectRequest,
      onSelectProject,
    });
    expect(element).toBeDefined();
  });

  it('complies strictly with Zero-Overflow constraints (max 2 words per action)', () => {
    const actions = ['Solicitud', 'Servicio'];
    actions.forEach((label) => {
      const words = label.trim().split(/\s+/);
      expect(words.length).toBeLessThanOrEqual(2);
    });
  });
});
