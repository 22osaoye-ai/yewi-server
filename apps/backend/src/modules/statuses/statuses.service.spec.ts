import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeService } from '../../common/realtime/realtime.service';
import { StatusesService } from './statuses.service';

describe('StatusesService', () => {
  let service: StatusesService;
  let prisma: any;

  const mockPrisma = {
    status: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    statusComment: {
      create: jest.fn(),
    },
    statusReaction: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(1),
    },
    notification: {
      create: jest.fn().mockResolvedValue({ id: 'notif-1', isRead: false, createdAt: new Date() }),
    },
  };

  const mockRealtime = {
    emitStatusCreated: jest.fn(),
    emitStatusComment: jest.fn(),
    emitStatusReaction: jest.fn(),
    emitNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatusesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RealtimeService, useValue: mockRealtime },
      ],
    }).compile();

    service = module.get<StatusesService>(StatusesService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createStatus', () => {
    it('should throw ForbiddenException if user is not Pro', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-client-1',
        isPro: false,
        professionalProfile: { isPro: false },
        subscription: { status: 'CANCELED' },
      });

      await expect(
        service.createStatus('user-client-1', {
          caption: 'Nuevo trabajo completado',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow creating status if user has active Yewi Pro subscription', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'pro-user-1',
        isPro: true,
        professionalProfile: { isPro: true },
        subscription: { status: 'ACTIVE' },
      });

      mockPrisma.status.create.mockResolvedValue({
        id: 'status-123',
        authorId: 'pro-user-1',
        caption: 'Trabajo de fontanería',
        expiresAt: new Date(Date.now() + 86400000),
      });

      const result = await service.createStatus('pro-user-1', {
        caption: 'Trabajo de fontanería',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('status-123');
      expect(mockPrisma.status.create).toHaveBeenCalled();
    });
  });

  describe('addComment', () => {
    it('should add comment to active status', async () => {
      mockPrisma.status.findUnique.mockResolvedValue({
        id: 'status-123',
        expiresAt: new Date(Date.now() + 86400000),
      });

      mockPrisma.statusComment.create.mockResolvedValue({
        id: 'comment-1',
        statusId: 'status-123',
        authorId: 'client-1',
        content: '¡Gran trabajo!',
        createdAt: new Date(),
        author: {
          profile: { displayName: 'Cliente Satisfecho', avatarUrl: null },
          professionalProfile: null,
        },
      });

      const result = await service.addComment('client-1', 'status-123', {
        content: '¡Gran trabajo!',
      });

      expect(result.content).toBe('¡Gran trabajo!');
      expect(result.authorName).toBe('Cliente Satisfecho');
    });
  });

  describe('reactToStatus', () => {
    it('should create reaction if none exists', async () => {
      mockPrisma.status.findUnique.mockResolvedValue({ id: 'status-123' });
      mockPrisma.statusReaction.findUnique.mockResolvedValue(null);
      mockPrisma.statusReaction.create.mockResolvedValue({
        id: 'reaction-1',
        statusId: 'status-123',
        userId: 'user-1',
        reactionType: 'LIKE',
      });

      const result = await service.reactToStatus('user-1', 'status-123', {
        reactionType: 'LIKE',
      });

      expect(result).toEqual({ reacted: true, reactionType: 'LIKE' });
    });

    it('should toggle off reaction if same type exists', async () => {
      mockPrisma.status.findUnique.mockResolvedValue({ id: 'status-123' });
      mockPrisma.statusReaction.findUnique.mockResolvedValue({
        id: 'reaction-1',
        reactionType: 'LIKE',
      });
      mockPrisma.statusReaction.delete.mockResolvedValue({});

      const result = await service.reactToStatus('user-1', 'status-123', {
        reactionType: 'LIKE',
      });

      expect(result).toEqual({ reacted: false, reactionType: null });
      expect(mockPrisma.statusReaction.delete).toHaveBeenCalledWith({
        where: { id: 'reaction-1' },
      });
    });
  });
});
