import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export enum CreditPack {
  STARTER = 'STARTER', // 20 créditos = 19 €
  PROFESSIONAL = 'PROFESSIONAL', // 50 créditos = 45 €
  BUSINESS = 'BUSINESS', // 100 créditos = 80 €
  ENTERPRISE = 'ENTERPRISE', // 250 créditos = 180 €
}

export class BuyCreditsDto {
  @ApiProperty({ enum: CreditPack, example: CreditPack.PROFESSIONAL })
  @IsEnum(CreditPack)
  pack: CreditPack;

  @ApiPropertyOptional({
    example: 'pm_card_visa',
    description: 'Token de método de pago o pasarela',
  })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}

export class CreateCreditPaymentIntentDto {
  @ApiProperty({ enum: CreditPack, example: CreditPack.PROFESSIONAL })
  @IsEnum(CreditPack)
  pack: CreditPack;
}

export class ConfirmCreditPaymentDto {
  @ApiProperty({
    example: 'pi_3MtwBwLkdIwHu7ix28a3tqPa',
    description: 'ID del PaymentIntent verificado por la pasarela de pagos',
  })
  @IsString()
  @IsNotEmpty()
  paymentIntentId: string;
}

export class RequestPayoutDto {
  @ApiProperty({ example: 150.0, description: 'Cantidad en euros a retirar' })
  @IsNumber()
  @IsPositive()
  @Min(20)
  amount: number;

  @ApiProperty({
    example: 'ES9121000418450200051332',
    description: 'IBAN o cuenta Stripe Connect',
  })
  @IsString()
  @IsNotEmpty()
  destinationAccount: string;
}
