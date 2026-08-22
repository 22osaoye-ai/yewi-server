import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateQuoteProposalDto {
  @ApiProperty({
    example: 120.0,
    description: 'Precio total del presupuesto propuesto',
  })
  @IsNumber()
  @Min(1)
  price: number;

  @ApiProperty({
    example: 2,
    description: 'Días estimados para completar el trabajo',
  })
  @IsInt()
  @Min(1)
  estimatedDays: number;

  @ApiProperty({
    example:
      'Hola! Puedo pasarme mañana mismo a revisar y reparar la fuga. Incluyo materiales y garantía de 6 meses.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    example: {
      labor: 80.0,
      materials: 40.0,
      warrantyMonths: 6,
    },
    description: 'Desglose detallado del presupuesto',
  })
  @IsOptional()
  @IsObject()
  breakdown?: Record<string, any>;

  @ApiPropertyOptional({ example: '2026-09-01T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
