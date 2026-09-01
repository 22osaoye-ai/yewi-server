import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockConfig = {
    get: jest.fn((key: string) => {
      if (key === 'STRIPE_SECRET_KEY') return '';
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: ConfigService, useValue: mockConfig },
        { provide: PrismaService, useValue: {} },
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
});
