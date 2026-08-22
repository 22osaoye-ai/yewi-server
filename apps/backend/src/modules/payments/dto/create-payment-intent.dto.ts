import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiProperty({ example: 49.99, description: 'Monto a cobrar en EUR' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ example: 'EUR' })
  @IsString()
  currency: string = 'EUR';

  @ApiPropertyOptional({
    example: 'GIG_PURCHASE',
    description: 'Tipo de compra',
  })
  @IsOptional()
  @IsString()
  paymentType?: string;

  @ApiPropertyOptional({ example: 'ID_DEL_PAQUETE_O_SOLICITUD' })
  @IsOptional()
  @IsString()
  referenceId?: string;
}
