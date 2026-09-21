import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreatePromotionDto {
  @ApiProperty({ example: '20% de Descuento en Instalación de Aire' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Descuento especial por tiempo limitado o permanente en instalación.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 20, description: 'Porcentaje de descuento (1-100)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional({ example: 25.0, description: 'Importe fijo de descuento en euros' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  discountAmount?: number;

  @ApiPropertyOptional({ example: 'VERANO20' })
  @IsOptional()
  @IsString()
  promoCode?: string;

  @ApiPropertyOptional({ example: 'Climatización' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'OFERTA FLASH' })
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiPropertyOptional({ example: true, description: 'Indica si el descuento es permanente' })
  @IsOptional()
  @IsBoolean()
  isPermanent?: boolean;

  @ApiPropertyOptional({ example: '2026-09-15T23:59:59.000Z', description: 'Fecha límite de la promoción (obligatoria si no es permanente)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
