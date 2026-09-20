import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KycStatus } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ReviewKycDto {
  @ApiProperty({ enum: [KycStatus.VERIFIED, KycStatus.REJECTED] })
  @IsEnum(KycStatus)
  status: KycStatus;

  @ApiPropertyOptional({
    example: 'El documento no es legible o está caducado',
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional({ example: ['TOP_RATED', 'VERIFIED_PRO'] })
  @IsOptional()
  badges?: string[];
}

export class ResolveDisputeDto {
  @ApiProperty({
    example: 50.0,
    description: 'Cantidad en euros a reembolsar al cliente',
  })
  @IsNumber()
  @Min(0)
  refundAmountClient: number;

  @ApiProperty({
    example: 50.0,
    description: 'Cantidad en euros a pagar al profesional',
  })
  @IsNumber()
  @Min(0)
  payoutAmountPro: number;

  @ApiProperty({
    example:
      'Se acuerda un reembolso del 50% debido a entregas parciales no completadas.',
  })
  @IsString()
  @IsNotEmpty()
  resolutionNotes: string;
}

export class ProcessPayoutDto {
  @ApiProperty({ enum: ['APPROVE', 'REJECT'], example: 'APPROVE' })
  @IsEnum(['APPROVE', 'REJECT'])
  action: 'APPROVE' | 'REJECT';

  @ApiPropertyOptional({ example: 'Transferencia bancaria procesada vía SEPA' })
  @IsOptional()
  @IsString()
  notes?: string;
}

