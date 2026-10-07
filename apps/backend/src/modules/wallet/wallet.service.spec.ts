
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
      updateMany: jest.fn(),
    },
    ledgerTransaction: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
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

    expect(mockPrisma.wallet.updateMany).not.toHaveBeenCalled();
  });

  it('records pending payout and deducts available balance when funds are sufficient', async () => {
    mockPrisma.wallet.findUnique.mockResolvedValue({
      id: 'wallet_1',
      fiatAvailableBalance: 250.0,
    });
    mockPrisma.wallet.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.ledgerTransaction.create.mockResolvedValue({ id: 'payout_tx_1' });

    const result = await service.requestPayout('user_1', {
      amount: 100.0,
      destinationAccount: 'ES9121000418450200051332',
    });

    expect(result.success).toBe(true);
    expect(mockPrisma.wallet.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'wallet_1', fiatAvailableBalance: { gte: 100.0 } },
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

  it('rejects payout with BadRequestException if concurrent debit causes count to be 0', async () => {
    mockPrisma.wallet.findUnique.mockResolvedValue({
      id: 'wallet_1',
      fiatAvailableBalance: 250.0,
    });
    mockPrisma.wallet.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.requestPayout('user_1', {
        amount: 100.0,
        destinationAccount: 'ES9121000418450200051332',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('credits fiat balance once and prevents duplicate crediting on repeated webhook delivery', async () => {
    mockPrisma.wallet.findUnique.mockResolvedValue({
      id: 'wallet_1',
      fiatAvailableBalance: 50.0,
      creditBalance: 0,
      transactions: [],
    });
    mockPrisma.ledgerTransaction.findFirst
      .mockResolvedValueOnce(null) // Primera entrega: no existe previa completada
      .mockResolvedValueOnce(null) // No existe previa pendiente
      .mockResolvedValueOnce({
        id: 'tx_completed_1',
        status: TransactionStatus.COMPLETED,
      }); // Segunda entrega: ya existe completada
    mockPrisma.ledgerTransaction.create.mockResolvedValue({ id: 'tx_new_1' });
    mockPrisma.wallet.update.mockResolvedValue({
      id: 'wallet_1',
      fiatAvailableBalance: 100.0,
    });

    // 1. Primera entrega del webhook
    const firstDelivery = await service.creditFiatDeposit({
      userId: 'user_1',
      amount: 50.0,
      paymentIntentId: 'pi_test_123',
    });

    expect(firstDelivery.success).toBe(true);
    expect(firstDelivery.transactionId).toBe('tx_new_1');
    expect(mockPrisma.wallet.update).toHaveBeenCalledTimes(1);
    expect(mockPrisma.wallet.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'wallet_1' },
        data: { fiatAvailableBalance: { increment: 50.0 } },
      }),
    );

    // 2. Segunda entrega duplicada del webhook del mismo payment_intent
    const duplicateDelivery = await service.creditFiatDeposit({
      userId: 'user_1',
      amount: 50.0,
      paymentIntentId: 'pi_test_123',
    });

    expect(duplicateDelivery.success).toBe(true);
    expect(duplicateDelivery.alreadyProcessed).toBe(true);
    // Verificar que NO se incrementó el saldo por segunda vez
    expect(mockPrisma.wallet.update).toHaveBeenCalledTimes(1);
  });

  it('handles concurrent webhook deliveries of the same pending deposit atomically', async () => {
    mockPrisma.wallet.findUnique.mockResolvedValue({
      id: 'wallet_1',
      fiatAvailableBalance: 10.0,
      creditBalance: 0,
      transactions: [],
    });
    // Ambas llamadas encuentran la transacción en estado PENDING
    mockPrisma.ledgerTransaction.findFirst
      .mockResolvedValueOnce(null) // No completed
      .mockResolvedValueOnce({ id: 'pending_tx_1', status: TransactionStatus.PENDING })
      .mockResolvedValueOnce(null) // No completed
      .mockResolvedValueOnce({ id: 'pending_tx_1', status: TransactionStatus.PENDING });

    // La primera llamada actualiza PENDING -> COMPLETED exitosamente (count: 1)
    mockPrisma.ledgerTransaction.updateMany
      .mockResolvedValueOnce({ count: 1 })
      // La segunda llamada concurrente detecta que ya no está PENDING (count: 0)
      .mockResolvedValueOnce({ count: 0 });

    mockPrisma.wallet.update.mockResolvedValue({
      id: 'wallet_1',
      fiatAvailableBalance: 30.0,
    });

    const [res1, res2] = await Promise.all([
      service.creditFiatDeposit({
        userId: 'user_1',
        amount: 20.0,
        paymentIntentId: 'pi_concurrent_999',
      }),
      service.creditFiatDeposit({
        userId: 'user_1',
        amount: 20.0,
        paymentIntentId: 'pi_concurrent_999',
      }),
    ]);

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
    // Exactamente una acreditación de saldo ejecutada
    expect(mockPrisma.wallet.update).toHaveBeenCalledTimes(1);
  });
});

