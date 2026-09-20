import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionStatus, TransactionType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { CreditPack } from './dto/buy-credits.dto';
import { WalletService } from './wallet.service';

describe('WalletService payment flow', () => {
  let service: WalletService;

  const mockPrisma = {
    wallet: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    ledgerTransaction: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((callback: (tx: any) => unknown) =>
      callback(mockPrisma),
    ),
  };
  const mockPayments = {
    createPaymentIntent: jest.fn(),
    verifyPaymentIntent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PaymentsService, useValue: mockPayments },
      ],
    }).compile();
    service = module.get(WalletService);
    jest.clearAllMocks();
  });

  it('requires Stripe verification before crediting a wallet', async () => {
    mockPrisma.wallet.findUnique.mockResolvedValue({
      id: 'wallet_1',
      creditBalance: 0,
      transactions: [],
    });
    mockPrisma.ledgerTransaction.findFirst.mockResolvedValue({
      id: 'ledger_1',
      amount: 45,
      creditAmount: 50,
      status: TransactionStatus.PENDING,
      type: TransactionType.CREDIT_PURCHASE,
    });
    mockPayments.verifyPaymentIntent.mockRejectedValue(
      new BadRequestException('payment incomplete'),
    );

    await expect(
      service.confirmCreditPayment('user_1', { paymentIntentId: 'pi_1' }),
    ).rejects.toThrow(BadRequestException);
    expect(mockPayments.verifyPaymentIntent).toHaveBeenCalledWith(
      'pi_1',
      'user_1',
      45,
    );
    expect(mockPrisma.ledgerTransaction.update).not.toHaveBeenCalled();
    expect(mockPrisma.wallet.update).not.toHaveBeenCalled();
  });

  it('does not auto-credit when starting a purchase', async () => {
    mockPrisma.wallet.findUnique.mockResolvedValue({
      id: 'wallet_1',
      creditBalance: 0,
      transactions: [],
    });
    mockPayments.createPaymentIntent.mockResolvedValue({
      clientSecret: 'secret',
      paymentIntentId: 'pi_1',
    });
    mockPrisma.ledgerTransaction.create.mockResolvedValue({ id: 'ledger_1' });

    await service.buyCredits('user_1', { pack: CreditPack.PROFESSIONAL });

    expect(mockPayments.createPaymentIntent).toHaveBeenCalled();
    expect(mockPayments.verifyPaymentIntent).not.toHaveBeenCalled();
  });

  it('deposits fiat funds and updates ledger transaction', async () => {
    mockPrisma.wallet.findUnique.mockResolvedValue({
      id: 'wallet_1',
      fiatAvailableBalance: 50.0,
    });
    mockPrisma.wallet.update.mockResolvedValue({
      id: 'wallet_1',
      fiatAvailableBalance: 150.0,
    });
    mockPrisma.ledgerTransaction.create.mockResolvedValue({ id: 'ledger_dep_1' });

    const result = await service.depositFiat('user_1', { amount: 100.0 });

    expect(result.success).toBe(true);
    expect(mockPrisma.wallet.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'wallet_1' },
        data: { fiatAvailableBalance: { increment: 100.0 } },
      }),
    );
    expect(mockPrisma.ledgerTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: TransactionType.ORDER_PAYMENT,
          amount: 100.0,
          status: TransactionStatus.COMPLETED,
        }),
      }),
    );
  });

  it('throws BadRequestException when requesting payout greater than available fiat balance', async () => {
    mockPrisma.wallet.findUnique.mockResolvedValue({
      id: 'wallet_1',
      fiatAvailableBalance: 30.0, // Solo tiene 30 €
    });

    await expect(
      service.requestPayout('user_1', {
        amount: 100.0,
        destinationAccount: 'ES9121000418450200051332',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(mockPrisma.wallet.update).not.toHaveBeenCalled();
  });

  it('records pending payout and deducts available balance when funds are sufficient', async () => {
    mockPrisma.wallet.findUnique.mockResolvedValue({
      id: 'wallet_1',
      fiatAvailableBalance: 250.0,
    });
    mockPrisma.wallet.update.mockResolvedValue({
      id: 'wallet_1',
      fiatAvailableBalance: 150.0,
    });
    mockPrisma.ledgerTransaction.create.mockResolvedValue({ id: 'payout_tx_1' });

    const result = await service.requestPayout('user_1', {
      amount: 100.0,
      destinationAccount: 'ES9121000418450200051332',
    });

    expect(result.success).toBe(true);
    expect(mockPrisma.wallet.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'wallet_1' },
        data: { fiatAvailableBalance: { decrement: 100.0 } },
      }),
    );
    expect(mockPrisma.ledgerTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: TransactionType.PAYOUT_WITHDRAWAL,
          amount: -100.0,
          status: TransactionStatus.PENDING,
          metadata: { destinationAccount: 'ES9121000418450200051332' },
        }),
      }),
    );
  });
});
