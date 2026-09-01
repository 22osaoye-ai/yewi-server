import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LeadStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { LeadsService } from './leads.service';

describe('LeadsService', () => {
  let service: LeadsService;

  const mockTx: any = {
    category: { findFirst: jest.fn(), create: jest.fn() },
    serviceRequest: { create: jest.fn() },
    professionalProfile: { findMany: jest.fn() },
    notification: { create: jest.fn(), createMany: jest.fn() },
    $executeRaw: jest.fn(),
    leadUnlock: { create: jest.fn() },
    ledgerTransaction: { create: jest.fn() },
    wallet: { findUnique: jest.fn() },
  };

  const mockPrisma = {
    category: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    serviceRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    professionalProfile: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      createMany: jest.fn(),
    },
    quoteProposal: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    leadUnlock: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((cb: any) =>
      typeof cb === 'function' ? cb(mockTx) : cb,
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should unlock a lead for an active subscriber without wallet or credit debit', async () => {
    mockPrisma.professionalProfile.findUnique.mockResolvedValue({
      id: 'pro_1',
      businessName: 'Profesional',
      isPro: false,
      user: {
        isPro: false,
        subscription: {
          status: 'ACTIVE',
          stripeSubscriptionId: 'sub_123',
          stripeCustomerId: 'cus_123',
        },
      },
    });

    mockPrisma.serviceRequest.findUnique.mockResolvedValue({
      id: 'req_1',
      clientId: 'client_1',
      title: 'Solicitud',
      status: LeadStatus.OPEN,
      maxUnlocks: 5,
      unlocksCount: 1,
      client: {
        email: 'client@example.com',
        profile: { firstName: 'Cliente', lastName: 'Yewi' },
      },
    });

    mockPrisma.leadUnlock.findUnique.mockResolvedValue(null);
    mockTx.$executeRaw.mockResolvedValueOnce(1);
    mockTx.notification.create.mockResolvedValue({ id: 'notification_1' });

    const result = await service.unlockLead('user_pro_1', 'req_1');

    expect(result.creditsSpent).toBe(0);
    expect(mockTx.leadUnlock.create).toHaveBeenCalledWith({
      data: {
        serviceRequestId: 'req_1',
        professionalProfileId: 'pro_1',
        creditsSpent: 0,
      },
    });
    expect(mockTx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(mockTx.ledgerTransaction.create).not.toHaveBeenCalled();
    expect(mockTx.wallet.findUnique).not.toHaveBeenCalled();
  });

  it('should reject unlocking when the professional has no active subscription', async () => {
    mockPrisma.professionalProfile.findUnique.mockResolvedValue({
      id: 'pro_1',
      isPro: false,
      user: { isPro: false, subscription: { status: 'CANCELED' } },
    });

    await expect(service.unlockLead('user_pro_1', 'req_1')).rejects.toThrow(
      ForbiddenException,
    );
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('should preserve the maximum unlock limit for active subscribers', async () => {
    mockPrisma.professionalProfile.findUnique.mockResolvedValue({
      id: 'pro_1',
      isPro: false,
      user: {
        isPro: false,
        subscription: {
          status: 'ACTIVE',
          stripeSubscriptionId: 'sub_123',
          stripeCustomerId: 'cus_123',
        },
      },
    });
    mockPrisma.serviceRequest.findUnique.mockResolvedValue({
      id: 'req_1',
      status: LeadStatus.OPEN,
      maxUnlocks: 5,
      unlocksCount: 5,
      client: { email: 'client@example.com', profile: null },
    });
    mockPrisma.leadUnlock.findUnique.mockResolvedValue(null);
    mockTx.$executeRaw.mockResolvedValueOnce(0);

    await expect(service.unlockLead('user_pro_1', 'req_1')).rejects.toThrow(
      'límite máximo',
    );
  });

  it('should send a proposal for an active subscriber without checking credits', async () => {
    mockPrisma.professionalProfile.findUnique.mockResolvedValue({
      id: 'pro_1',
      businessName: 'Profesional',
      isPro: false,
      user: {
        isPro: false,
        subscription: {
          status: 'TRIALING',
          stripeSubscriptionId: 'sub_123',
          stripeCustomerId: 'cus_123',
        },
      },
    });
    mockPrisma.leadUnlock.findUnique.mockResolvedValue({ id: 'unlock_1' });
    mockPrisma.serviceRequest.findUnique.mockResolvedValue({
      id: 'req_1',
      status: LeadStatus.OPEN,
      clientId: 'client_1',
      title: 'Solicitud',
    });
    mockPrisma.quoteProposal.create.mockResolvedValue({ id: 'proposal_1' });
    mockPrisma.notification.create.mockResolvedValue({ id: 'notification_1' });

    const result = await service.sendQuoteProposal('user_pro_1', 'req_1', {
      price: 100,
      estimatedDays: 3,
      message: 'Puedo realizar el trabajo',
    });

    expect(result).toEqual({ id: 'proposal_1' });
    expect(mockPrisma.quoteProposal.create).toHaveBeenCalled();
  });

  it('should reject sending a proposal when the professional has no active subscription', async () => {
    mockPrisma.professionalProfile.findUnique.mockResolvedValue({
      id: 'pro_1',
      isPro: false,
      user: { isPro: false, subscription: { status: 'PAST_DUE' } },
    });


    await expect(
      service.sendQuoteProposal('user_pro_1', 'req_1', {
        price: 100,
        estimatedDays: 3,
        message: 'Puedo realizar el trabajo',
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(mockPrisma.leadUnlock.findUnique).not.toHaveBeenCalled();
  });

  it('should publish a request and notify matching professionals', async () => {
    const category = {
      id: 'category_1',
      name: 'Electricidad',
      slug: 'electricidad',
      baseLeadCreditCost: 10,
    };
    const createdRequest = { id: 'request_1', category };
    mockTx.category.findFirst.mockResolvedValue(category);
    mockTx.serviceRequest.create.mockResolvedValue(createdRequest);
    mockTx.professionalProfile.findMany.mockResolvedValue([
      { userId: 'pro_1' },
      { userId: 'pro_2' },
    ]);

    const result = await service.createRequest('client_1', {
      title: 'Reparar instalación',
      description: 'Necesito revisar la instalación eléctrica',
      category: 'Electricidad',
    });

    expect(result).toBe(createdRequest);
    expect(mockTx.notification.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          userId: 'pro_1',
          type: 'LEAD_MATCH',
          link: '/requests?id=request_1',
        }),
      ]),
    });
  });

  it('should surface notification failures instead of hiding them', async () => {
    const category = {
      id: 'category_1',
      name: 'Electricidad',
      slug: 'electricidad',
      baseLeadCreditCost: 10,
    };
    mockTx.category.findFirst.mockResolvedValue(category);
    mockTx.serviceRequest.create.mockResolvedValue({
      id: 'request_1',
      category,
    });
    mockTx.professionalProfile.findMany.mockResolvedValue([
      { userId: 'pro_1' },
    ]);
    mockTx.notification.createMany.mockRejectedValue(
      new Error('notification unavailable'),
    );

    await expect(
      service.createRequest('client_1', {
        title: 'Reparar instalación',
        description: 'Necesito revisar la instalación eléctrica',
        category: 'Electricidad',
      }),
    ).rejects.toThrow('notification unavailable');
  });
});
