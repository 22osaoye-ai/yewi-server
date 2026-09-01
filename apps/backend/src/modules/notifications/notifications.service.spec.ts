import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockPrisma = {
    notification: {
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe obtener las notificaciones del usuario', async () => {
    mockPrisma.notification.findMany.mockResolvedValue([
      { id: 'notif-1', userId: 'user-1', title: 'Test' },
    ]);

    const result = await service.getMyNotifications('user-1');
    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    expect(result).toHaveLength(1);
  });

  it('debe eliminar una notificación individual por ID y userId', async () => {
    mockPrisma.notification.deleteMany.mockResolvedValue({ count: 1 });

    const result = await service.deleteNotification('user-1', 'notif-1');
    expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith({
      where: { id: 'notif-1', userId: 'user-1' },
    });
    expect(result).toEqual({ success: true, count: 1 });
  });

  it('debe eliminar un lote de notificaciones si se proporcionan IDs', async () => {
    mockPrisma.notification.deleteMany.mockResolvedValue({ count: 2 });

    const result = await service.deleteNotifications('user-1', ['notif-1', 'notif-2']);
    expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['notif-1', 'notif-2'] }, userId: 'user-1' },
    });
    expect(result).toEqual({ success: true, count: 2 });
  });

  it('debe eliminar todas las notificaciones del usuario si no se proporcionan IDs', async () => {
    mockPrisma.notification.deleteMany.mockResolvedValue({ count: 5 });

    const result = await service.deleteNotifications('user-1');
    expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(result).toEqual({ success: true, count: 5 });
  });
});
