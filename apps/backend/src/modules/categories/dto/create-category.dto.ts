import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Hogar y Reformas',
    description: 'Nombre de la categoría',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'hogar-reformas',
    description: 'Slug único para URL',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({
    example: 'Servicios de reformas, fontanería, electricidad y mantenimiento.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'home' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    example: 'https://images.unsplash.com/home-banner.jpg',
  })
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiPropertyOptional({ enum: CategoryType, default: CategoryType.HYBRID })
  @IsOptional()
  @IsEnum(CategoryType)
  type?: CategoryType = CategoryType.HYBRID;

  @ApiPropertyOptional({
    description: 'ID de la categoría padre (si es subcategoría)',
  })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({
    example: {
      type: 'object',
      properties: {
        propertyType: {
          type: 'string',
          enum: ['Piso', 'Casa', 'Local', 'Oficina'],
          title: 'Tipo de inmueble',
        },
        areaSquareMeters: {
          type: 'number',
          title: 'Metros cuadrados aproximados',
        },
        urgency: {
          type: 'string',
          enum: ['Lo antes posible', 'En los próximos 15 días', 'Flexible'],
          title: '¿Cuándo lo necesitas?',
        },
      },
      required: ['propertyType', 'urgency'],
    },
    description: 'Esquema JSON dinámico para el cuestionario de ProntoPro',
  })
  @IsOptional()
  @IsObject()
  formSchema?: Record<string, any>;

  @ApiPropertyOptional({
    example: 10,
    description:
      'Coste base histórico de la categoría; el desbloqueo de leads requiere Yewi Pro y no consume créditos',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  baseLeadCreditCost?: number = 10;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number = 0;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiPropertyOptional({ enum: CategoryType })
  @IsOptional()
  @IsEnum(CategoryType)
  type?: CategoryType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  formSchema?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  baseLeadCreditCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
