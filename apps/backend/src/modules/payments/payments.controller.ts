import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentsService } from './payments.service';

interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

@ApiTags('Payments (Pasarela Stripe, Intenciones de Pago & Webhooks)')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('create-intent')
  @ApiOperation({
    summary: 'Crear PaymentIntent para cobro con tarjeta o checkout de Gig',
  })
  @ApiResponse({
    status: 200,
    description: 'clientSecret generado para el frontend',
  })
  async createPaymentIntent(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePaymentIntentDto,
  ) {
    return this.paymentsService.createPaymentIntent(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('subscription')
  @ApiOperation({
    summary: 'Consultar estado actual de suscripción Yewi Pro',
  })
  async getSubscriptionStatus(@CurrentUser('id') userId: string) {
    return this.paymentsService.getSubscriptionStatus(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('subscription/sync')
  @ApiOperation({
    summary: 'Sincronizar y forzar comprobación en tiempo real con Stripe',
  })
  async syncSubscription(@CurrentUser('id') userId: string) {
    return this.paymentsService.syncSubscriptionWithStripe(userId);
  }


  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('subscription/cancel')
  @ApiOperation({
    summary: 'Cancelar renovación automática de suscripción Pro in-app',
  })
  async cancelSubscriptionAutoRenew(@CurrentUser('id') userId: string) {
    return this.paymentsService.cancelSubscriptionAutoRenew(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('subscription/resume')
  @ApiOperation({
    summary: 'Reanudar renovación automática de suscripción Pro in-app',
  })
  async resumeSubscriptionAutoRenew(@CurrentUser('id') userId: string) {
    return this.paymentsService.resumeSubscriptionAutoRenew(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('subscription/checkout')
  @ApiOperation({
    summary:
      'Crear sesión de Stripe Checkout para suscripción mensual Yewi Pro (9,99 €/mes)',
  })
  async createSubscriptionCheckout(@CurrentUser('id') userId: string) {
    return this.paymentsService.createSubscriptionCheckout(userId);
  }


  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('subscription/portal')
  @ApiOperation({
    summary:
      'Crear sesión del Stripe Customer Portal para gestionar/cancelar suscripción',
  })
  async createCustomerPortalSession(@CurrentUser('id') userId: string) {
    return this.paymentsService.createCustomerPortalSession(userId);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook de eventos Stripe (PaymentIntents, suscripciones)',
  })
  handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest,
  ) {
    const payload = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
    return this.paymentsService.handleWebhook(signature, payload);
  }
}
