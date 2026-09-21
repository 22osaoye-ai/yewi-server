import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EscrowStatus, OrderStatus, OrderType, TransactionStatus, TransactionType } from '@prisma/client';
import { OrdersService } from './orders.service';

describe('OrdersService - Escrow, Payouts & Refunds', () => {
  let service: OrdersService;

  const mockPrisma = {
    gigPackage: {
      findUnique: jest.fn(),
    },
    gigExtra: {
      findMany: jest.fn(),
    },
    wallet: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    ledgerTransaction: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    conversation: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    message: {
      create: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    professionalProfile: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    gig: {
      update: jest.fn(),
    },
    $transaction: jest.fn(async (cb: (tx: any) => Promise<any>) => cb(mockPrisma)),
  } as any;

  const mockRealtime = {
    emitNotification: jest.fn(),
  } as any;

  const mockPayments = {
    createGigOrderCheckoutSession: jest.fn(),
    retrieveCheckoutSession: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrdersService(mockPrisma, mockPayments, mockRealtime);
  });

  describe('createGigOrder (Escrow Hold)', () => {
    it('throws BadRequestException if client balance is insufficient for Escrow hold', async () => {
      mockPrisma.gigPackage.findUnique.mockResolvedValue({
        id: 'pkg-1',
        price: 150,
        deliveryDays: 5,
        gigId: 'gig-1',
        gig: {
          title: 'Servicio de Fontanería',
          professionalProfileId: 'pro-profile-1',
          professionalProfile: {
            userId: 'pro-user-1',
            user: { id: 'pro-user-1' },
          },
        },
      });

      mockPrisma.wallet.findUnique.mockResolvedValue({
        id: 'wallet-client-1',
        userId: 'client-user-1',
        fiatAvailableBalance: 50.0,
      });

      await expect(
        service.createGigOrder('client-user-1', { gigPackageId: 'pkg-1' }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.wallet.update).not.toHaveBeenCalled();
      expect(mockPrisma.order.create).not.toHaveBeenCalled();
    });

    it('creates a Stripe Checkout session for a gig package with Escrow custody metadata', async () => {
      mockPrisma.gigPackage.findUnique.mockResolvedValue({
        id: 'pkg-1',
        name: 'Básico',
        price: 195,
        deliveryDays: 3,
        gigId: 'gig-1',
        gig: {
          title: 'Diseño Web Pro',
          professionalProfileId: 'pro-profile-1',
          professionalProfile: {
            userId: 'pro-user-1',
            user: { id: 'pro-user-1' },
          },
        },
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'client-user-1',
        email: 'client@yewi.app',
        profile: { firstName: 'Cliente', lastName: 'Pruebas' },
      });

      mockPayments.createGigOrderCheckoutSession.mockResolvedValue({
        url: 'https://checkout.stripe.com/c/pay/cs_test_123',
        sessionId: 'cs_test_123',
      });

      const res = await service.createGigCheckoutSession('client-user-1', {
        gigPackageId: 'pkg-1',
      });

      expect(res.sessionId).toBe('cs_test_123');
      expect(mockPayments.createGigOrderCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'client-user-1',
          gigPackageId: 'pkg-1',
          amount: 195,
        }),
      );
    });

    it('confirms a paid Stripe Checkout session and creates an Order with funds in Escrow', async () => {
      mockPayments.retrieveCheckoutSession.mockResolvedValue({
        id: 'cs_test_paid_123',
        payment_status: 'paid',
        payment_intent: 'pi_real_stripe_456',
        metadata: {
          userId: 'client-user-1',
          gigPackageId: 'pkg-1',
        },
      });

      mockPrisma.ledgerTransaction.findFirst.mockResolvedValue(null);

      mockPrisma.gigPackage.findUnique.mockResolvedValue({
        id: 'pkg-1',
        name: 'Básico',
        price: 195,
        deliveryDays: 3,
        gigId: 'gig-1',
        gig: {
          title: 'Diseño Web Pro',
          professionalProfileId: 'pro-profile-1',
          professionalProfile: {
            userId: 'pro-user-1',
            user: { id: 'pro-user-1' },
          },
        },
      });

      mockPrisma.wallet.findUnique.mockResolvedValue({
        id: 'wallet-client-1',
        userId: 'client-user-1',
        fiatAvailableBalance: 0,
      });

      mockPrisma.ledgerTransaction.create.mockResolvedValue({ id: 'ledger-stripe-1' });
      mockPrisma.ledgerTransaction.update.mockResolvedValue({ id: 'ledger-stripe-1' });
      mockPrisma.order.create.mockResolvedValue({
        id: 'order-stripe-1',
        orderNumber: 'ORD-GIG-789012',
        clientId: 'client-user-1',
        totalAmount: 195,
        escrowStatus: EscrowStatus.HELD,
        status: OrderStatus.PENDING_REQUIREMENTS,
      });
      mockPrisma.conversation.findFirst.mockResolvedValue(null);
      mockPrisma.conversation.create.mockResolvedValue({ id: 'conv-1' });
      mockPrisma.message.create.mockResolvedValue({ id: 'msg-1' });
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' });

      const confirmedOrder = await service.confirmGigCheckoutSession(
        'client-user-1',
        'cs_test_paid_123',
      );

      expect(confirmedOrder.id).toBe('order-stripe-1');
      expect(mockPrisma.ledgerTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stripePaymentIntentId: 'pi_real_stripe_456',
            status: TransactionStatus.COMPLETED,
            metadata: expect.objectContaining({
              action: 'STRIPE_ESCROW_DEPOSIT',
              sessionId: 'cs_test_paid_123',
            }),
          }),
        }),
      );
    });

    it('holds funds in Escrow and creates order when client has sufficient balance', async () => {
      mockPrisma.gigPackage.findUnique.mockResolvedValue({
        id: 'pkg-1',
        price: 100,
        deliveryDays: 3,
        gigId: 'gig-1',
        gig: {
          title: 'Electricidad Rápida',
          professionalProfileId: 'pro-profile-1',
          professionalProfile: {
            userId: 'pro-user-1',
            user: { id: 'pro-user-1' },
          },
        },
      });

      mockPrisma.wallet.findUnique.mockResolvedValue({
        id: 'wallet-client-1',
        userId: 'client-user-1',
        fiatAvailableBalance: 200.0,
      });

      mockPrisma.wallet.update.mockResolvedValue({ id: 'wallet-client-1', fiatAvailableBalance: 100.0 });
      mockPrisma.ledgerTransaction.create.mockResolvedValue({ id: 'ledger-1' });
      mockPrisma.order.create.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'ORD-GIG-123456',
        clientId: 'client-user-1',
        totalAmount: 100,
        escrowStatus: EscrowStatus.HELD,
        status: OrderStatus.PENDING_REQUIREMENTS,
      });
      mockPrisma.conversation.create.mockResolvedValue({ id: 'conv-1' });
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' });

      const result = await service.createGigOrder('client-user-1', { gigPackageId: 'pkg-1' });

      expect(result.id).toBe('order-1');
      expect(mockPrisma.wallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'wallet-client-1' },
          data: { fiatAvailableBalance: { decrement: 100 } },
        }),
      );
      expect(mockPrisma.ledgerTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: TransactionType.ORDER_PAYMENT,
            amount: -100,
            status: TransactionStatus.COMPLETED,
            metadata: expect.objectContaining({ action: 'WALLET_ESCROW_DEPOSIT' }),
          }),
        }),
      );
      expect(mockPrisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            escrowStatus: EscrowStatus.HELD,
            totalAmount: 100,
          }),
        }),
      );
    });
  });

  describe('cancelOrder (Escrow Refund)', () => {
    it('throws NotFoundException if order does not exist', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.cancelOrder('user-1', 'nonexistent-order')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException if user is neither client nor assigned professional', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        clientId: 'client-1',
        professionalProfile: { user: { id: 'pro-1' } },
        status: OrderStatus.IN_PROGRESS,
      });

      await expect(service.cancelOrder('stranger-user', 'order-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws BadRequestException if order is already completed', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        clientId: 'client-1',
        professionalProfile: { user: { id: 'pro-1' } },
        status: OrderStatus.COMPLETED,
      });

      await expect(service.cancelOrder('client-1', 'order-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('refunds 100% of escrow to client wallet and marks order CANCELLED', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'ORD-GIG-999',
        clientId: 'client-1',
        totalAmount: 120,
        status: OrderStatus.IN_PROGRESS,
        escrowStatus: EscrowStatus.HELD,
        client: {
          wallet: {
            id: 'wallet-client-1',
            fiatAvailableBalance: 10,
          },
        },
        professionalProfile: {
          user: { id: 'pro-1' },
        },
      });

      mockPrisma.order.update.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.CANCELLED,
        escrowStatus: EscrowStatus.REFUNDED_TO_CLIENT,
      });
      mockPrisma.wallet.update.mockResolvedValue({ id: 'wallet-client-1' });
      mockPrisma.ledgerTransaction.create.mockResolvedValue({ id: 'ledger-refund-1' });
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' });

      const result = await service.cancelOrder('client-1', 'order-1', {
        reason: 'El profesional no pudo realizar el trabajo',
      });

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(result.escrowStatus).toBe(EscrowStatus.REFUNDED_TO_CLIENT);

      // Verificación de reembolso atómico en wallet del cliente
      expect(mockPrisma.wallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'wallet-client-1' },
          data: { fiatAvailableBalance: { increment: 120 } },
        }),
      );

      // Verificación de registro en libro mayor
      expect(mockPrisma.ledgerTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: TransactionType.ORDER_REFUND,
            amount: 120,
            status: TransactionStatus.COMPLETED,
            metadata: expect.objectContaining({
              action: 'ESCROW_REFUND',
              reason: 'El profesional no pudo realizar el trabajo',
              cancelledBy: 'CLIENT',
            }),
          }),
        }),
      );
    });
  });

  describe('approveDelivery (Escrow Release to Professional)', () => {
    it('releases escrow funds to professional when client approves delivery', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'ORD-123',
        clientId: 'client-1',
        status: OrderStatus.DELIVERED,
        totalAmount: 100,
        platformFee: 15,
        proEarnings: 85,
        professionalProfileId: 'pro-profile-1',
        professionalProfile: {
          user: {
            id: 'pro-user-1',
            wallet: { id: 'pro-wallet-1' },
          },
        },
      });

      mockPrisma.order.update.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.COMPLETED,
        escrowStatus: EscrowStatus.RELEASED_TO_PRO,
      });
      mockPrisma.wallet.update.mockResolvedValue({ id: 'pro-wallet-1' });
      mockPrisma.ledgerTransaction.create.mockResolvedValue({ id: 'ledger-release-1' });
      mockPrisma.professionalProfile.update.mockResolvedValue({});
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' });

      const result = await service.approveDelivery('client-1', 'order-1');

      expect(result.status).toBe(OrderStatus.COMPLETED);
      expect(result.escrowStatus).toBe(EscrowStatus.RELEASED_TO_PRO);

      // Verificación de abono de ganancias en wallet del profesional
      expect(mockPrisma.wallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pro-wallet-1' },
          data: { fiatAvailableBalance: { increment: 85 } },
        }),
      );

      // Verificación de registro en libro mayor
      expect(mockPrisma.ledgerTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: TransactionType.ESCROW_RELEASE,
            amount: 85,
            status: TransactionStatus.COMPLETED,
          }),
        }),
      );
    });
  });
});
