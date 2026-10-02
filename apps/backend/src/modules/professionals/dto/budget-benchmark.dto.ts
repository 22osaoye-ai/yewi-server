import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class BudgetBenchmarkDto {
  @ApiPropertyOptional({
    example: 'reforma_bano',
    description:
      'Identificador de la plantilla sectorial (reforma_integral, reforma_bano, reforma_cocina, pintura, climatizacion, electricidad, fontaneria)',
  })
  @IsOptional()
  @IsString()
  templateKey?: string;

  @ApiPropertyOptional({
    example: 'Alicatado de paredes con gres porcelánico',
    description: 'Título o concepto de la partida para consultar rango de precios de mercado',
  })
  @IsOptional()
  @IsString()
  itemTitle?: string;

  @ApiPropertyOptional({
    example: 'm2',
    description: 'Unidad de medida (m2, ml, ud, h, pa)',
  })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({
    example: 'Zaragoza',
    description: 'Provincia en España para calibrar índices de costes territoriales',
  })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({
    example: 25,
    description: 'Cantidad estimada para calcular subtotal proyectado',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;
}
