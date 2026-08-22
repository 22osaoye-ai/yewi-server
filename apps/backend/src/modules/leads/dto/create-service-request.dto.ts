import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateServiceRequestDto {
  @ApiProperty({ example: 'ID_DE_LA_CATEGORIA' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 'Necesito fontanero urgente para fuga en cocina' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Hay una fuga de agua debajo del fregadero que no para...',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: {
      propertyType: 'Piso',
      urgency: 'Lo antes posible',
      room: 'Cocina',
    },
    description: 'Respuestas al cuestionario dinámico de la categoría',
  })
  @IsObject()
  questionnaireAnswers: Record<string, any>;

  @ApiPropertyOptional({
    example: 80.0,
    description: 'Presupuesto mínimo estimado',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMin?: number;

  @ApiPropertyOptional({
    example: 250.0,
    description: 'Presupuesto máximo estimado',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMax?: number;

  @ApiPropertyOptional({
    default: false,
    description: 'Indica si es un servicio urgente',
  })
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean = false;

  @ApiPropertyOptional({ example: '2026-09-01T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  preferredDate?: string;

  @ApiProperty({ example: '28001' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiProperty({ example: 'Madrid' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({ example: 'España' })
  @IsOptional()
  @IsString()
  country?: string = 'ES';

  @ApiPropertyOptional({ example: 'Calle Gran Vía 28' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 40.4168,
    description: 'Latitud de la solicitud',
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    example: -3.7038,
    description: 'Longitud de la solicitud',
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    default: false,
    description: '¿Es un trabajo 100% online/remoto?',
  })
  @IsOptional()
  @IsBoolean()
  isRemote?: boolean = false;
}
