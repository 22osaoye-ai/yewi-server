import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { PaymentsService } from './payments.service';
import { OrdersService } from '../orders/orders.service';
import { WalletService } from '../wallet/wallet.service';
import { LeadsService } from '../leads/leads.service';
import { RedisCacheService } from '../../common/cache/redis.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  const mockOrdersService = {
    confirmGigCheckoutSession: jest.fn(),
  };
  const mockWalletService = {
    creditFiatDeposit: jest.fn(),
  };
  const mockLeadsService = {
    confirmLeadCheckoutSession: jest.fn(),
  };
  const mockRedisCache = {
    get: jest.fn(),
    set: jest.fn(),
    acquireLock: jest.fn(),
    releaseLock: jest.fn(),
  };

  const mockConfig = {
    get: jest.fn((key: string) => {
      if (key === 'STRIPE_SECRET_KEY') return '';
      if (key === 'STRIPE_WEBHOOK_SECRET') return 'whsec_valid_secret';
      return undefined;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: ConfigService, useValue: mockConfig },
        { provide: PrismaService, useValue: {} },
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: WalletService, useValue: mockWalletService },
        { provide: LeadsService, useValue: mockLeadsService },
        { provide: RedisCacheService, useValue: mockRedisCache },
      ],
    }).compile();

    service = module.get(PaymentsService);
  });

  it('rejects payment verification when Stripe is not configured', async () => {
    await expect(
      service.verifyPaymentIntent('pi_missing', 'user_1', 45),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('does not expose a successful payment result when Stripe is unavailable', async () => {
    await expect(
      service.createPaymentIntent('user_1', {
        amount: 45,
        currency: 'EUR',
      }),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('processes WALLET_TOPUP webhook once and deduplicates subsequent identical webhook calls', async () => {
    const mockEvent = {
      id: 'evt_stripe_100',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_topup_1',
          payment_intent: 'pi_test_100',
          amount_total: 5000,
          metadata: {
            userId: 'user_1',
            paymentType: 'WALLET_TOPUP',
            amount: '50',
          },
        },
      },
    };

    (service as any).stripe = {
      webhooks: {
        constructEvent: jest.fn().mockReturnValue(mockEvent),
      },
    };

    mockRedisCache.get.mockResolvedValue(null);
    mockRedisCache.acquireLock.mockResolvedValue('lock_token_123');
    mockWalletService.creditFiatDeposit.mockResolvedValue({
      success: true,
      transactionId: 'tx_1',
    });

    // 1. Primera entrega del webhook
    const res1 = await service.handleWebhook(
      'valid_sig',
      Buffer.from('payload'),
    );
    expect(res1).toEqual({ received: true });
    expect(mockWalletService.creditFiatDeposit).toHaveBeenCalledTimes(1);
    expect(mockWalletService.creditFiatDeposit).toHaveBeenCalledWith({
      userId: 'user_1',
      amount: 50,
      paymentIntentId: 'pi_test_100',
      sessionId: 'cs_test_topup_1',
    });

    // 2. Segunda entrega duplicada del webhook del mismo event.id
    const res2 = await service.handleWebhook(
      'valid_sig',
      Buffer.from('payload'),
    );
    expect(res2).toEqual({ received: true, duplicate: true });
    // Verificar que creditFiatDeposit NO se vuelve a ejecutar
    expect(mockWalletService.creditFiatDeposit).toHaveBeenCalledTimes(1);
  });
});

