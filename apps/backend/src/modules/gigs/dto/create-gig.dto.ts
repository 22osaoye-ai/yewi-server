import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PackageTier } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreatePackageDto {
  @ApiProperty({ enum: PackageTier, example: PackageTier.BASIC })
  @IsEnum(PackageTier)
  tier: PackageTier;

  @ApiProperty({ example: 'Paquete Básico' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Logotipo básico en alta resolución + 1 revisión' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 49.99 })
  @IsNumber()
  @Min(5)
  price: number;

  @ApiProperty({ example: 3, description: 'Días estimados de entrega' })
  @IsInt()
  @Min(1)
  deliveryDays: number;

  @ApiProperty({
    example: 2,
    description: 'Número de revisiones (-1 para ilimitadas)',
  })
  @IsInt()
  revisions: number = 1;

  @ApiPropertyOptional({
    example: {
      sourceFiles: true,
      highResolution: true,
      commercialUse: true,
      conceptsCount: 2,
    },
  })
  @IsOptional()
  @IsObject()
  features?: Record<string, any>;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPopular?: boolean = false;
}

export class CreateExtraDto {
  @ApiProperty({ example: 'Entrega Extra Rápida (24h)' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    example: 'Recibe tu pedido completo en solo 24 horas.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 25.0 })
  @IsNumber()
  @Min(1)
  price: number;

  @ApiPropertyOptional({
    example: -2,
    description: 'Días a restar o sumar en el plazo de entrega',
  })
  @IsOptional()
  @IsInt()
  additionalDeliveryDays?: number = 0;
}

export class CreateGigDto {
  @ApiProperty({
    example: 'Cambio de baldosas de baño',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'cambio-de-baldosas-123' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'ID_DE_LA_CATEGORIA' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Baños' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    example:
      'Descripción detallada de lo que incluye el servicio, proceso de trabajo...',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ example: 5, description: 'Días estimados de ejecución' })
  @IsOptional()
  @IsInt()
  deliveryDays?: number;

  @ApiPropertyOptional({ example: 'Zaragoza' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: ['reformas', 'baldosas', 'alicatado'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  searchTags?: string[];

  @ApiPropertyOptional({ example: ['https://images.unsplash.com/gig-cover1.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  coverImages?: string[];

  @ApiPropertyOptional({ example: 'https://youtube.com/watch?v=12345' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({
    example: [
      {
        question: '¿Incluye materiales?',
        answer: 'Incluye material de agarre y lechada.',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  faqs?: Array<{ question: string; answer: string }>;

  @ApiPropertyOptional({
    example: ['Superficie despejada'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiPropertyOptional({
    type: [CreatePackageDto],
    description: 'Paquetes multinivel opcionales',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePackageDto)
  packages?: CreatePackageDto[];

  @ApiPropertyOptional({ type: [CreateExtraDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExtraDto)
  extras?: CreateExtraDto[];
}
