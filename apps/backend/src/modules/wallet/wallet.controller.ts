import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  BuyCreditsDto,
  ConfirmCreditPaymentDto,
  CreateCreditPaymentIntentDto,
  RequestPayoutDto,
} from './dto/buy-credits.dto';
import { WalletService } from './wallet.service';

@ApiTags('Wallet & Credits (Billetera, Recarga de Créditos & Retiros)')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Public()
  @Get('packages')
  @ApiOperation({
    summary:
      'Ver paquetes y precios de créditos disponibles para profesionales',
  })
  getCreditPackages() {
    return this.walletService.getCreditPackages();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({
    summary: 'Ver saldo de créditos, balance fiat y transacciones recientes',
  })
  @ApiResponse({
    status: 200,
    description: 'Billetera del usuario con balance de créditos y fiat',
  })
  async getMyWallet(@CurrentUser('id') userId: string) {
    return this.walletService.getMyWallet(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('buy-credits/intent')
  @ApiOperation({
    summary:
      'Crear PaymentIntent seguro en la pasarela de pagos para compra de créditos',
  })
  @ApiResponse({
    status: 200,
    description: 'Intención de pago generada para procesar con Stripe/Escrow',
  })
  async createCreditPaymentIntent(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCreditPaymentIntentDto,
  ) {
    return this.walletService.createCreditPaymentIntent(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('buy-credits/confirm')
  @ApiOperation({
    summary:
      'Confirmar pago verificado por la pasarela y acreditar créditos en billetera',
  })
  @ApiResponse({
    status: 200,
    description: 'Créditos acreditados tras verificación criptográfica',
  })
  async confirmCreditPayment(
    @CurrentUser('id') userId: string,
    @Body() dto: ConfirmCreditPaymentDto,
  ) {
    return this.walletService.confirmCreditPayment(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('buy-credits')
  @ApiOperation({
    summary: 'Comprar paquete de créditos procesando el pago en pasarela',
  })
  @ApiResponse({
    status: 200,
    description:
      'PaymentIntent creado; los créditos se acreditan tras confirmar el pago',
  })
  async buyCredits(
    @CurrentUser('id') userId: string,
    @Body() dto: BuyCreditsDto,
  ) {
    return this.walletService.buyCredits(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('request-payout')
  @ApiOperation({
    summary:
      'Solicitar retiro de ganancias fiat a cuenta bancaria (Profesionales)',
  })
  @ApiResponse({ status: 200, description: 'Retiro solicitado' })
  async requestPayout(
    @CurrentUser('id') userId: string,
    @Body() dto: RequestPayoutDto,
  ) {
    return this.walletService.requestPayout(userId, dto);
  }
}
