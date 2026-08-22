import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LeadStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { LeadsService } from './leads.service';

describe('LeadsService', () => {
  let service: LeadsService;

  const mockTx: any = {
    $executeRaw: jest.fn(),
    leadUnlock: { create: jest.fn() },
    ledgerTransaction: { create: jest.fn() },
    notification: { create: jest.fn() },
    wallet: { findUnique: jest.fn() },
  };

  const mockPrisma = {
    category: {
      findUnique: jest.fn(),
    },
    serviceRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    professionalProfile: {
      findUnique: jest.fn(),
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

  it('should throw BadRequestException when unlocking a lead with insufficient credits', async () => {
    mockPrisma.professionalProfile.findUnique.mockResolvedValue({
      id: 'pro_1',
      user: {
        wallet: {
          id: 'wallet_1',
          creditBalance: 5,
        },
      },
    });

    mockPrisma.serviceRequest.findUnique.mockResolvedValue({
      id: 'req_1',
      status: LeadStatus.OPEN,
      creditCost: 15,
      maxUnlocks: 5,
      unlocksCount: 1,
    });

    mockPrisma.leadUnlock.findUnique.mockResolvedValue(null);

    // executeRaw 1 (ServiceRequest update succeeds), executeRaw 2 (Wallet update fails due to low balance)
    mockTx.$executeRaw
      .mockResolvedValueOnce(1) // ServiceRequest unlocksCount + 1
      .mockResolvedValueOnce(0); // Wallet creditBalance update returns 0 rows updated

    await expect(service.unlockLead('user_pro_1', 'req_1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw BadRequestException if max unlocks limit (5) is reached', async () => {
    mockPrisma.professionalProfile.findUnique.mockResolvedValue({
      id: 'pro_1',
      user: {
        wallet: { id: 'wallet_1', creditBalance: 100 },
      },
    });

    mockPrisma.serviceRequest.findUnique.mockResolvedValue({
      id: 'req_1',
      status: LeadStatus.OPEN,
      creditCost: 10,
      maxUnlocks: 5,
      unlocksCount: 5,
    });

    mockPrisma.leadUnlock.findUnique.mockResolvedValue(null);

    // executeRaw 1 (ServiceRequest fails because unlocksCount >= maxUnlocks)
    mockTx.$executeRaw.mockResolvedValueOnce(0);

    await expect(service.unlockLead('user_pro_1', 'req_1')).rejects.toThrow(
      BadRequestException,
    );
  });
});
