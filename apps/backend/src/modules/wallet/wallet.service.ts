import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { TransactionStatus, TransactionType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import {
  BuyCreditsDto,
  ConfirmCreditPaymentDto,
  CreateCreditPaymentIntentDto,
  CreditPack,
  RequestPayoutDto,
} from './dto/buy-credits.dto';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  private readonly creditPackPricing = {
    [CreditPack.STARTER]: { credits: 20, price: 19.0 },
    [CreditPack.PROFESSIONAL]: { credits: 50, price: 45.0 },
    [CreditPack.BUSINESS]: { credits: 100, price: 80.0 },
    [CreditPack.ENTERPRISE]: { credits: 250, price: 180.0 },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Obtener saldo de créditos, saldo fiat y transacciones recientes
   */
  async getMyWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          userId,
          creditBalance: 0,
          fiatAvailableBalance: 0,
          fiatPendingBalance: 0,
        },
        include: {
          transactions: true,
        },
      });
    }

    return wallet;
  }

  /**
   * Obtener paquetes de créditos disponibles para compra
   */
  getCreditPackages() {
    return [
      {
        id: CreditPack.STARTER,
        name: 'Pack Inicio',
        credits: 20,
        price: 19.0,
        discount: '5%',
      },
      {
        id: CreditPack.PROFESSIONAL,
        name: 'Pack Profesional',
        credits: 50,
        price: 45.0,
        discount: '10%',
        popular: true,
      },
      {
        id: CreditPack.BUSINESS,
        name: 'Pack Empresa',
        credits: 100,
        price: 80.0,
        discount: '20%',
      },
      {
        id: CreditPack.ENTERPRISE,
        name: 'Pack Ilimitado',
        credits: 250,
        price: 180.0,
        discount: '28%',
      },
    ];
  }

  /**
   * 1. Crear sesión / PaymentIntent seguro para compra de créditos en Pasarela de Pagos
   */
  async createCreditPaymentIntent(
    userId: string,
    dto: CreateCreditPaymentIntentDto,
  ) {
    const packConfig = this.creditPackPricing[dto.pack];
    if (!packConfig) {
      throw new BadRequestException('Paquete de créditos inválido');
    }

    const wallet = await this.getMyWallet(userId);

    // Crear intención de pago en pasarela
    const paymentIntent = await this.paymentsService.createPaymentIntent(
      userId,
      {
        amount: packConfig.price,
        currency: 'EUR',
        paymentType: 'CREDIT_PURCHASE',
        referenceId: dto.pack,
      },
    );

    // Registrar transacción PENDIENTE en el libro mayor (Ledger)
    const ledgerTx = await this.prisma.ledgerTransaction.create({
      data: {
        walletId: wallet.id,
        type: TransactionType.CREDIT_PURCHASE,
        amount: packConfig.price,
        creditAmount: packConfig.credits,
        currency: 'EUR',
        status: TransactionStatus.PENDING,
        metadata: {
          paymentIntentId: paymentIntent.paymentIntentId,
          pack: dto.pack,
          credits: packConfig.credits,
          price: packConfig.price,
        },
      },
    });

    return {
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.paymentIntentId,
      amount: packConfig.price,
      credits: packConfig.credits,
      pack: dto.pack,
      transactionId: ledgerTx.id,
    };
  }

  /**
   * 2. Confirmar pago verificado por pasarela y acreditar créditos de forma atómica e idempotente
   */
  async confirmCreditPayment(userId: string, dto: ConfirmCreditPaymentDto) {
    const wallet = await this.getMyWallet(userId);

    // Buscar la transacción asociada al PaymentIntent
    const pendingTx = await this.prisma.ledgerTransaction.findFirst({
      where: {
        walletId: wallet.id,
        type: TransactionType.CREDIT_PURCHASE,
        metadata: {
          path: ['paymentIntentId'],
          equals: dto.paymentIntentId,
        },
      },
    });

    if (!pendingTx) {
      throw new BadRequestException(
        'No se encontró una orden de compra pendiente para este pago.',
      );
    }

    // Idempotencia: Si ya fue procesado, retornar balance actual sin duplicar
    if (pendingTx.status === TransactionStatus.COMPLETED) {
      return {
        success: true,
        message: 'El pago ya ha sido procesado anteriormente.',
        purchasedCredits: pendingTx.creditAmount,
        newCreditBalance: wallet.creditBalance,
      };
    }

    const creditAmount = pendingTx.creditAmount || 0;
    if (creditAmount <= 0) {
      throw new BadRequestException(
        'Cantidad de créditos inválida en la transacción.',
      );
    }

    await this.paymentsService.verifyPaymentIntent(
      dto.paymentIntentId,
      userId,
      Number(pendingTx.amount),
    );

    // Ejecutar acreditación atómica
    return this.prisma.$transaction(async (tx) => {
      // 1. Marcar transacción como COMPLETADA
      await tx.ledgerTransaction.update({
        where: { id: pendingTx.id },
        data: {
          status: TransactionStatus.COMPLETED,
        },
      });

      // 2. Incrementar balance de créditos
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          creditBalance: { increment: creditAmount },
        },
      });

      this.logger.log(
        `Pago verificado: ${creditAmount} créditos añadidos al usuario ${userId}. Nuevo saldo: ${updatedWallet.creditBalance}`,
      );

      return {
        success: true,
        message: `¡Pago verificado! Has recibido ${creditAmount} créditos.`,
        purchasedCredits: creditAmount,
        newCreditBalance: updatedWallet.creditBalance,
      };
    });
  }

  /**
   * Compra de créditos pasando obligatoriamente por pasarela de pagos
   */
  async buyCredits(userId: string, dto: BuyCreditsDto) {
    return this.createCreditPaymentIntent(userId, { pack: dto.pack });
  }

  /**
   * Solicitud de retiro de saldo fiat ganado por un profesional
   */
  async requestPayout(userId: string, dto: RequestPayoutDto) {
    const wallet = await this.getMyWallet(userId);

    const availableNum = Number(wallet.fiatAvailableBalance);
    if (availableNum < dto.amount) {
      throw new BadRequestException(
        `Saldo disponible insuficiente para retirar. Saldo actual: ${availableNum} €`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Descontar saldo disponible
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          fiatAvailableBalance: { decrement: dto.amount },
        },
      });

      // Registrar movimiento de retiro
      const txRecord = await tx.ledgerTransaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.PAYOUT_WITHDRAWAL,
          amount: -dto.amount,
          currency: 'EUR',
          status: TransactionStatus.PENDING,
          metadata: {
            destinationAccount: dto.destinationAccount,
          },
        },
      });

      return {
        success: true,
        message: `Solicitud de retiro de ${dto.amount} € registrada correctamente`,
        transactionId: txRecord.id,
        newAvailableBalance: updated.fiatAvailableBalance,
      };
    });
  }
}
