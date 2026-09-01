import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RealtimeService } from '../../common/realtime/realtime.service';
import { PrismaService } from '../../database/prisma.service';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;
  let prisma: any;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    conversation: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    serviceRequest: {
      findUnique: jest.fn(),
    },
    professionalProfile: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  };

  const mockRealtime = {
    emitNotification: jest.fn(),
    emitToUser: jest.fn(),
    server: { to: jest.fn().mockReturnThis(), emit: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RealtimeService, useValue: mockRealtime },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStreamToken', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getStreamToken('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return stream token, apiKey, and user metadata for valid user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        roles: ['CLIENT'],
        isPro: false,
        profile: {
          displayName: 'Juan Fontanero',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
        professionalProfile: null,
        subscription: null,
      });

      const result = await service.getStreamToken('user-123');

      expect(result).toBeDefined();
      expect(result.userId).toBe('user-123');
      expect(result.token).toBeDefined();
      expect(result.apiKey).toBeDefined();
      expect(result.user.name).toBe('Juan Fontanero');
    });
  });

  describe('getContacts', () => {
    it('should return real contacts with proper metadata', async () => {
      mockPrisma.conversation.findMany.mockResolvedValue([]);
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.professionalProfile.findMany.mockResolvedValue([
        {
          userId: 'pro-user-2',
          businessName: 'Reformas Martínez',
          isPro: true,
          avgRating: 4.9,
          totalReviews: 18,
          categories: [{ name: 'Reformas' }],
          user: {
            isActive: true,
            profile: { displayName: 'Carlos Martínez', avatarUrl: null, phoneNumber: '600112233' },
            subscription: { status: 'ACTIVE' },
          },
        },
      ]);

      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'pro-user-2',
          email: 'pro@martinez.es',
          roles: ['PROFESSIONAL'],
          isPro: true,
          profile: { displayName: 'Carlos Martínez', avatarUrl: null, phoneNumber: '600112233', city: 'Madrid' },
          professionalProfile: {
            businessName: 'Reformas Martínez',
            isPro: true,
            avgRating: 4.9,
            totalReviews: 18,
            categories: [{ name: 'Reformas' }],
            city: 'Madrid',
          },
          subscription: { status: 'ACTIVE' },
        },
      ]);

      const contacts = await service.getContacts('current-user');

      expect(contacts).toBeInstanceOf(Array);
      expect(contacts.length).toBe(1);
      expect(contacts[0].displayName).toBe('Reformas Martínez');
      expect(contacts[0].isPro).toBe(true);
      expect(contacts[0].category).toBe('Reformas');
    });
  });
});
