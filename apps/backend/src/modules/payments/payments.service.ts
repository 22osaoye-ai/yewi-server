import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../database/prisma.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey =
      this.configService.get<string>('STRIPE_SECRET_KEY') ||
      'sk_test_placeholder';
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2026-01-28.acacia' as Stripe.LatestApiVersion,
    });
  }

  /**
   * Crear PaymentIntent en Stripe
   */
  async createPaymentIntent(userId: string, dto: CreatePaymentIntentDto) {
    try {
      const amountInCents = Math.round(dto.amount * 100);

      // Si la clave de Stripe es de prueba simulada o válida, creamos o simulamos el intent
      const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
      if (!secretKey || secretKey.includes('placeholder')) {
        return {
          clientSecret: `pi_mock_${Date.now()}_secret_${Date.now()}`,
          paymentIntentId: `pi_mock_${Date.now()}`,
          amount: dto.amount,
          currency: dto.currency || 'EUR',
          status: 'requires_payment_method',
          isMock: true,
        };
      }

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: dto.currency.toLowerCase(),
        metadata: {
          userId,
          paymentType: dto.paymentType ?? 'GIG_PURCHASE',
          referenceId: dto.referenceId ?? '',
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: dto.amount,
        currency: dto.currency,
        status: paymentIntent.status,
      };
    } catch (error) {
      this.logger.error('Error al crear PaymentIntent en Stripe:', error);
      throw new BadRequestException(
        'Error al inicializar la pasarela de pagos',
      );
    }
  }

  /**
   * Procesar webhook de Stripe
   */
  handleWebhook(signature: string, payload: Buffer) {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    if (!webhookSecret || webhookSecret.includes('placeholder')) {
      return { received: true, simulated: true };
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );

      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object;
          this.logger.log(`Pago recibido con éxito: ${paymentIntent.id}`);
          break;
        }
        default:
          this.logger.log(`Evento de Stripe no manejado: ${event.type}`);
      }

      return { received: true };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error procesando webhook';
      this.logger.error(`Error en Webhook de Stripe: ${message}`);
      throw new BadRequestException(`Webhook Error: ${message}`);
    }
  }
}
