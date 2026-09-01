import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../database/prisma.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { RealtimeService } from '../../common/realtime/realtime.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Optional() private readonly realtime?: RealtimeService,
  ) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (apiKey && !apiKey.includes('placeholder')) {
      this.stripe = new Stripe(apiKey);
    }
  }

  /**
   * Crear PaymentIntent en Stripe Real
   */
  async createPaymentIntent(
    userId: string,
    dto: CreatePaymentIntentDto,
  ): Promise<{
    clientSecret: string | null;
    paymentIntentId: string;
    amount: number;
    currency: string;
    status: string;
  }> {
    if (!this.stripe) {
      throw new ServiceUnavailableException(
        'La pasarela de pagos Stripe no está configurada en el servidor',
      );
    }

    try {
      const amountInCents = Math.round(dto.amount * 100);

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
        'Error al inicializar el pago en la pasarela de pagos',
      );
    }
  }

  async verifyPaymentIntent(
    paymentIntentId: string,
    userId: string,
    expectedAmount: number,
  ): Promise<void> {
    if (!this.stripe) {
      throw new ServiceUnavailableException(
        'La pasarela de pagos Stripe no está configurada en el servidor',
      );
    }

    try {
      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);
      if (
        paymentIntent.status !== 'succeeded' ||
        paymentIntent.amount !== Math.round(expectedAmount * 100) ||
        paymentIntent.currency !== 'eur' ||
        paymentIntent.metadata.userId !== userId ||
        paymentIntent.metadata.paymentType !== 'CREDIT_PURCHASE'
      ) {
        throw new BadRequestException(
          'El pago no está completado o no corresponde a esta compra',
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error al verificar PaymentIntent en Stripe:', error);
      throw new BadRequestException('No se pudo verificar el pago en Stripe');
    }
  }

  /**
   * Obtener o crear ID de precio para Yewi Pro (9.99 EUR/mes)
   */
  private async getOrCreateProPriceId(): Promise<string> {
    if (!this.stripe) {
      throw new ServiceUnavailableException('Stripe no está configurado');
    }

    const configuredPriceOrProduct = this.configService.get<string>(
      'STRIPE_PRO_PRICE_ID',
    );

    // Si ya empieza por price_, usarlo directamente
    if (
      configuredPriceOrProduct &&
      configuredPriceOrProduct.startsWith('price_')
    ) {
      return configuredPriceOrProduct;
    }

    // Si es un ID de producto (prod_...), buscar su precio recurrente o crearlo
    if (
      configuredPriceOrProduct &&
      configuredPriceOrProduct.startsWith('prod_')
    ) {
      const prices = await this.stripe.prices.list({
        product: configuredPriceOrProduct,
        active: true,
        type: 'recurring',
        limit: 1,
      });

      if (prices.data.length > 0) {
        return prices.data[0].id;
      }

      // Si el producto no tiene precio recurrente activo, crearlo (9.99 EUR / mes)
      const newPrice = await this.stripe.prices.create({
        product: configuredPriceOrProduct,
        unit_amount: 999, // 9.99 EUR en céntimos
        currency: 'eur',
        recurring: { interval: 'month' },
      });
      return newPrice.id;
    }

    // Si no está configurado, buscar o crear producto "Yewi Pro"
    const products = await this.stripe.products.search({
      query: "name:'Yewi Pro' AND active:'true'",
    });

    let productId = products.data[0]?.id;
    if (!productId) {
      const product = await this.stripe.products.create({
        name: 'Yewi Pro',
        description:
          'Suscripción profesional Yewi Pro: solicitudes prioritarias, contacto directo, cobertura nacional y top en directorio.',
      });
      productId = product.id;
    }

    const prices = await this.stripe.prices.list({
      product: productId,
      active: true,
      type: 'recurring',
      limit: 1,
    });

    if (prices.data.length > 0) {
      return prices.data[0].id;
    }

    const createdPrice = await this.stripe.prices.create({
      product: productId,
      unit_amount: 999,
      currency: 'eur',
      recurring: { interval: 'month' },
    });

    return createdPrice.id;
  }

  /**
   * Crear sesión de Stripe Checkout para suscripción Yewi Pro (9,99 €/mes)
   */
  async createSubscriptionCheckout(
    userId: string,
  ): Promise<{ url: string; sessionId: string }> {
    if (!this.stripe) {
      throw new ServiceUnavailableException('Stripe no está configurado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, subscription: true },
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    let customerId = user.subscription?.stripeCustomerId;

    if (customerId) {
      try {
        await this.stripe.customers.retrieve(customerId);
      } catch (err) {
        this.logger.warn(
          `El cliente Stripe ${customerId} no existe o no es válido. Creando nuevo.`,
        );
        customerId = undefined;
      }
    }

    if (!customerId) {
      try {
        const customer = await this.stripe.customers.create({
          email: user.email,
          name: user.profile
            ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
            : undefined,
          metadata: { userId },
        });
        customerId = customer.id;

        const subscription = await this.prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            stripeCustomerId: customerId,
          },
          update: {
            stripeCustomerId: customerId,
          },
        });
      } catch (custErr: any) {
        this.logger.error('Error al crear cliente en Stripe:', custErr);
        throw new BadRequestException(
          `Error al registrar cliente en Stripe: ${custErr.message}`,
        );
      }
    }

    const priceId = await this.getOrCreateProPriceId();

    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: 'https://yewi.app/profile?subscription=success',
        cancel_url: 'https://yewi.app/profile?subscription=cancelled',
        metadata: {
          userId,
          type: 'YEWI_PRO_SUBSCRIPTION',
        },
      });

      return {
        url: session.url ?? '',
        sessionId: session.id,
      };
    } catch (checkoutErr: any) {
      this.logger.error(
        'Error al crear Checkout Session en Stripe:',
        checkoutErr,
      );
      throw new BadRequestException(`Error de Stripe: ${checkoutErr.message}`);
    }
  }

  /**
   * Crear sesión del Customer Portal para gestionar o cancelar suscripción
   */
  async createCustomerPortalSession(userId: string): Promise<{ url: string }> {
    if (!this.stripe) {
      throw new ServiceUnavailableException('Stripe no está configurado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    const customerId = user?.subscription?.stripeCustomerId;
    if (!customerId) {
      throw new BadRequestException(
        'No tienes una suscripción o cliente registrado en Stripe',
      );
    }

    const portalSession = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: 'https://yewi.app/profile',
    });

    return { url: portalSession.url };
  }

  /**
   * Sincroniza el estado de la suscripción consultando la API de Stripe en tiempo real
   */
  async syncSubscriptionWithStripe(userId: string) {
    if (!this.stripe) {
      return this.getSubscriptionStatusLocal(userId);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true, professionalProfile: true },
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    let customerId = user.subscription?.stripeCustomerId;

    // Si no tenemos customerId local, buscar por email en Stripe
    if (!customerId && user.email) {
      const customers = await this.stripe.customers.list({
        email: user.email,
        limit: 5,
      });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    if (customerId) {
      try {
        const subs = await this.stripe.subscriptions.list({
          customer: customerId,
          limit: 10,
        });

        const activeSub = subs.data.find(
          (s) => s.status === 'active' || s.status === 'trialing',
        );

        if (activeSub) {
          const rawSub = activeSub as any;
          const startTimestamp =
            rawSub.current_period_start ||
            rawSub.start_date ||
            rawSub.created ||
            rawSub.billing_cycle_anchor;
          const endTimestamp =
            rawSub.current_period_end ||
            rawSub.cancel_at ||
            (startTimestamp ? startTimestamp + 30 * 24 * 60 * 60 : undefined);

          const periodStart = startTimestamp
            ? new Date(startTimestamp * 1000)
            : new Date();
          const periodEnd = endTimestamp
            ? new Date(endTimestamp * 1000)
            : new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000);


          const updatedSub = await this.prisma.subscription.upsert({
            where: { userId },
            create: {
              userId,
              stripeCustomerId: customerId,
              stripeSubscriptionId: activeSub.id,
              stripePriceId: activeSub.items?.data?.[0]?.price?.id,
              status: activeSub.status.toUpperCase() as any,
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
              cancelAtPeriodEnd: Boolean(rawSub.cancel_at_period_end),
            },
            update: {
              stripeCustomerId: customerId,
              stripeSubscriptionId: activeSub.id,
              stripePriceId: activeSub.items?.data?.[0]?.price?.id,
              status: activeSub.status.toUpperCase() as any,
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
              cancelAtPeriodEnd: Boolean(rawSub.cancel_at_period_end),
            },
          });

          await this.prisma.user.update({
            where: { id: userId },
            data: { isPro: true },
          });

          if (user.professionalProfile) {
            await this.prisma.professionalProfile.update({
              where: { id: user.professionalProfile.id },
              data: { isPro: true },
            });
          }

          this.realtime?.emitSubscriptionUpdated({
            userId,
            isPro: true,
            status: updatedSub.status,
            subscriptionId: updatedSub.id,
            currentPeriodStart: updatedSub.currentPeriodStart,
            currentPeriodEnd: updatedSub.currentPeriodEnd,
            cancelAtPeriodEnd: updatedSub.cancelAtPeriodEnd,
          });

          let paymentMethod: {
            brand?: string;
            last4?: string;
            expMonth?: number;
            expYear?: number;
          } | null = null;

          try {
            if (activeSub.default_payment_method) {
              const pmId =
                typeof activeSub.default_payment_method === 'string'
                  ? activeSub.default_payment_method
                  : (activeSub.default_payment_method as any).id;
              const pm = await this.stripe.paymentMethods.retrieve(pmId);
              if (pm.card) {
                paymentMethod = {
                  brand: pm.card.brand,
                  last4: pm.card.last4,
                  expMonth: pm.card.exp_month,
                  expYear: pm.card.exp_year,
                };
              }
            } else {
              const pms = await this.stripe.paymentMethods.list({
                customer: customerId,
                type: 'card',
                limit: 1,
              });
              if (pms.data.length > 0 && pms.data[0].card) {
                paymentMethod = {
                  brand: pms.data[0].card.brand,
                  last4: pms.data[0].card.last4,
                  expMonth: pms.data[0].card.exp_month,
                  expYear: pms.data[0].card.exp_year,
                };
              }
            }
          } catch (pmErr) {
            this.logger.warn(`No se pudo obtener el método de pago: ${pmErr}`);
          }

          this.logger.log(
            `Suscripción Stripe sincronizada exitosamente como activa para usuario ${userId} (${activeSub.id})`,
          );

          return {
            isPro: true,
            plan: 'Yewi Pro',
            priceEur: 9.99,
            interval: 'month',
            paymentMethod,
            subscription: updatedSub,
          };
        }
      } catch (err: any) {
        this.logger.warn(
          `Error al sincronizar con Stripe para cliente ${customerId}: ${err.message}`,
        );
      }
    }

    return this.getSubscriptionStatusLocal(userId);
  }

  private async getSubscriptionStatusLocal(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    });

    const isPro = Boolean(
      user?.subscription &&
        (user.subscription.status === 'ACTIVE' ||
          user.subscription.status === 'TRIALING') &&
        user.subscription.stripeSubscriptionId &&
        user.subscription.stripeCustomerId,
    );

    return {
      isPro,
      plan: 'Yewi Pro',
      priceEur: 9.99,
      interval: 'month',
      paymentMethod: null,
      subscription: user?.subscription ?? null,
    };
  }

  /**
   * Cancelar renovación automática in-app sin salir a Stripe
   */
  async cancelSubscriptionAutoRenew(userId: string) {
    if (!this.stripe) {
      throw new ServiceUnavailableException('Stripe no está configurado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true, professionalProfile: true },
    });

    if (!user?.subscription?.stripeSubscriptionId) {
      throw new BadRequestException('No se encontró una suscripción activa');
    }

    try {
      const updatedSub = await this.stripe.subscriptions.update(
        user.subscription.stripeSubscriptionId,
        { cancel_at_period_end: true },
      );

      const dbSub = await this.prisma.subscription.update({
        where: { id: user.subscription.id },
        data: {
          cancelAtPeriodEnd: true,
        },
      });

      this.realtime?.emitSubscriptionUpdated({
        userId,
        isPro: true,
        status: dbSub.status,
        subscriptionId: dbSub.id,
        currentPeriodStart: dbSub.currentPeriodStart,
        currentPeriodEnd: dbSub.currentPeriodEnd,
        cancelAtPeriodEnd: true,
      });

      return {
        success: true,
        message:
          'Renovación automática desactivada. Seguirás disfrutando de Yewi Pro hasta el fin del periodo de facturación.',
        cancelAtPeriodEnd: true,
        subscription: dbSub,
      };
    } catch (err: any) {
      this.logger.error('Error al cancelar renovación de Stripe:', err);
      throw new BadRequestException(
        `No se pudo cancelar la renovación: ${err.message}`,
      );
    }
  }

  /**
   * Reanudar renovación automática in-app
   */
  async resumeSubscriptionAutoRenew(userId: string) {
    if (!this.stripe) {
      throw new ServiceUnavailableException('Stripe no está configurado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true, professionalProfile: true },
    });

    if (!user?.subscription?.stripeSubscriptionId) {
      throw new BadRequestException(
        'No se encontró una suscripción para reanudar',
      );
    }

    try {
      const updatedSub = await this.stripe.subscriptions.update(
        user.subscription.stripeSubscriptionId,
        { cancel_at_period_end: false },
      );

      const dbSub = await this.prisma.subscription.update({
        where: { id: user.subscription.id },
        data: {
          cancelAtPeriodEnd: false,
        },
      });

      this.realtime?.emitSubscriptionUpdated({
        userId,
        isPro: true,
        status: dbSub.status,
        subscriptionId: dbSub.id,
        currentPeriodStart: dbSub.currentPeriodStart,
        currentPeriodEnd: dbSub.currentPeriodEnd,
        cancelAtPeriodEnd: false,
      });

      return {
        success: true,
        message: 'Renovación automática reactivada con éxito.',
        cancelAtPeriodEnd: false,
        subscription: dbSub,
      };
    } catch (err: any) {
      this.logger.error('Error al reanudar suscripción en Stripe:', err);
      throw new BadRequestException(
        `No se pudo reanudar la suscripción: ${err.message}`,
      );
    }
  }


  /**
   * Obtener estado de la suscripción de un usuario (con sincronización en vivo)
   */
  async getSubscriptionStatus(userId: string) {
    return this.syncSubscriptionWithStripe(userId);
  }


  /**
   * Procesar webhook de Stripe
   */
  async handleWebhook(signature: string, payload: Buffer) {
    if (!this.stripe) {
      throw new ServiceUnavailableException(
        'Stripe no está configurado en el servidor',
      );
    }

    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    if (!webhookSecret || webhookSecret.includes('placeholder')) {
      throw new ServiceUnavailableException(
        'STRIPE_WEBHOOK_SECRET no está configurado en las variables de entorno',
      );
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );

      this.logger.log(`Evento recibido de Stripe: ${event.type}`);

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          const userId = session.metadata?.userId;

          if (userId && session.subscription) {
            const subscriptionId =
              typeof session.subscription === 'string'
                ? session.subscription
                : session.subscription.id;

            const stripeSub =
              await this.stripe.subscriptions.retrieve(subscriptionId);

            const rawSub = stripeSub as any;
            const sessionCustomerId =
              typeof session.customer === 'string' ? session.customer : null;
            const stripeCustomerId =
              typeof stripeSub.customer === 'string'
                ? stripeSub.customer
                : rawSub.customer?.id;
            if (
              !sessionCustomerId ||
              !stripeCustomerId ||
              sessionCustomerId !== stripeCustomerId ||
              !['active', 'trialing'].includes(stripeSub.status)
            ) {
              throw new BadRequestException(
                'La suscripción de Stripe no es válida o no está activa',
              );
            }
            const periodStart = rawSub.current_period_start
              ? new Date(rawSub.current_period_start * 1000)
              : new Date();
            const periodEnd = rawSub.current_period_end
              ? new Date(rawSub.current_period_end * 1000)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            const subscription = await this.prisma.subscription.upsert({
              where: { userId },
              create: {
                userId,
                stripeCustomerId:
                  typeof session.customer === 'string'
                    ? session.customer
                    : null,
                stripeSubscriptionId: stripeSub.id,
                stripePriceId: stripeSub.items?.data?.[0]?.price?.id,
                status: stripeSub.status.toUpperCase() as any,
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: Boolean(rawSub.cancel_at_period_end),
              },
              update: {
                stripeCustomerId:
                  typeof session.customer === 'string'
                    ? session.customer
                    : undefined,
                stripeSubscriptionId: stripeSub.id,
                stripePriceId: stripeSub.items?.data?.[0]?.price?.id,
                status: stripeSub.status.toUpperCase() as any,
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: Boolean(rawSub.cancel_at_period_end),
              },
            });

            const isActive =
              subscription.status === 'ACTIVE' ||
              subscription.status === 'TRIALING';
            await this.prisma.user.update({
              where: { id: userId },
              data: { isPro: isActive },
            });
            await this.prisma.professionalProfile.updateMany({
              where: { userId },
              data: { isPro: isActive },
            });

            this.realtime?.emitSubscriptionUpdated({
              userId,
              isPro: isActive,
              status: subscription.status,
              subscriptionId: subscription.id,
              currentPeriodStart: subscription.currentPeriodStart,
              currentPeriodEnd: subscription.currentPeriodEnd,
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            });

            this.logger.log(
              `Suscripción Yewi Pro activada para usuario: ${userId}`,
            );
          }
          break;
        }

        case 'customer.subscription.updated':
        case 'customer.subscription.created': {
          const sub = event.data.object as any;
          const customerId =
            typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;

          const existingSubscription = await this.prisma.subscription.findFirst(
            {
              where: {
                OR: [
                  { stripeSubscriptionId: sub.id },
                  { stripeCustomerId: customerId },
                ],
              },
            },
          );

          if (existingSubscription) {
            const isActive =
              (sub.status === 'active' || sub.status === 'trialing') &&
              Boolean(sub.id) &&
              Boolean(customerId);
            const periodStart = sub.current_period_start
              ? new Date(sub.current_period_start * 1000)
              : undefined;
            const periodEnd = sub.current_period_end
              ? new Date(sub.current_period_end * 1000)
              : undefined;

            const subscription = await this.prisma.subscription.update({
              where: { id: existingSubscription.id },
              data: {
                stripeSubscriptionId: sub.id,
                stripePriceId: sub.items?.data?.[0]?.price?.id,
                status: sub.status ? sub.status.toUpperCase() : 'ACTIVE',
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
                canceledAt: sub.canceled_at
                  ? new Date(sub.canceled_at * 1000)
                  : null,
              },
            });

            await this.prisma.user.update({
              where: { id: existingSubscription.userId },
              data: { isPro: isActive },
            });
            await this.prisma.professionalProfile.updateMany({
              where: { userId: existingSubscription.userId },
              data: { isPro: isActive },
            });

            this.realtime?.emitSubscriptionUpdated({
              userId: existingSubscription.userId,
              isPro: isActive,
              status: subscription.status,
              subscriptionId: subscription.id,
              currentPeriodStart: subscription.currentPeriodStart,
              currentPeriodEnd: subscription.currentPeriodEnd,
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            });
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const sub = event.data.object as any;

          const existingSubscription =
            await this.prisma.subscription.findUnique({
              where: { stripeSubscriptionId: sub.id },
            });

          if (existingSubscription) {
            const subscription = await this.prisma.subscription.update({
              where: { id: existingSubscription.id },
              data: {
                status: 'CANCELED',
                cancelAtPeriodEnd: false,
                canceledAt: new Date(),
              },
            });

            await this.prisma.user.update({
              where: { id: existingSubscription.userId },
              data: { isPro: false },
            });

            await this.prisma.professionalProfile.updateMany({
              where: { userId: existingSubscription.userId },
              data: { isPro: false },
            });
            this.realtime?.emitSubscriptionUpdated({
              userId: existingSubscription.userId,
              isPro: false,
              status: subscription.status,
              subscriptionId: subscription.id,
              currentPeriodStart: subscription.currentPeriodStart,
              currentPeriodEnd: subscription.currentPeriodEnd,
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            });

            this.logger.log(
              `Suscripción revocada para usuario: ${existingSubscription.userId}`,
            );
          }
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as any;
          const subId =
            typeof invoice.subscription === 'string'
              ? invoice.subscription
              : invoice.subscription?.id ||
                invoice.parent?.subscription_details?.subscription;

          if (subId) {
            const subRecord = await this.prisma.subscription.findUnique({
              where: { stripeSubscriptionId: subId },
            });

            if (subRecord) {
              // El acceso se deriva de Subscription.status e IDs Stripe;
              // un invoice exitoso no puede promover por sí solo una fila inválida.
            }
          }
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as any;
          const subId =
            typeof invoice.subscription === 'string'
              ? invoice.subscription
              : invoice.subscription?.id ||
                invoice.parent?.subscription_details?.subscription;

          if (subId) {
            const subRecord = await this.prisma.subscription.findUnique({
              where: { stripeSubscriptionId: subId },
            });
            await this.prisma.subscription.updateMany({
              where: { stripeSubscriptionId: subId },
              data: { status: 'PAST_DUE' },
            });
            if (subRecord) {
              await this.prisma.user.update({
                where: { id: subRecord.userId },
                data: { isPro: false },
              });
              await this.prisma.professionalProfile.updateMany({
                where: { userId: subRecord.userId },
                data: { isPro: false },
              });
              this.realtime?.emitSubscriptionUpdated({
                userId: subRecord.userId,
                isPro: false,
                status: 'PAST_DUE',
                subscriptionId: subRecord.id,
                currentPeriodStart: subRecord.currentPeriodStart,
                currentPeriodEnd: subRecord.currentPeriodEnd,
                cancelAtPeriodEnd: subRecord.cancelAtPeriodEnd,
              });
            }
          }
          break;
        }

        default:
          this.logger.log(
            `Evento de Stripe no procesado directamente: ${event.type}`,
          );
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
