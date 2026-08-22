import {
  Body,
  Controller,
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
