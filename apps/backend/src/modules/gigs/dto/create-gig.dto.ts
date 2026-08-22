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
    example: 'Diseñaré un logotipo profesional y moderno para tu marca',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'diseno-logotipo-profesional-marca-123' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: 'ID_DE_LA_CATEGORIA' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    example:
      'Descripción detallada de lo que incluye el servicio, proceso de trabajo...',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: ['diseño', 'branding', 'logo', 'vector'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  searchTags?: string[];

  @ApiProperty({ example: ['https://images.unsplash.com/gig-cover1.jpg'] })
  @IsArray()
  @IsString({ each: true })
  coverImages: string[];

  @ApiPropertyOptional({ example: 'https://youtube.com/watch?v=12345' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({
    example: [
      {
        question: '¿En qué formato recibiré los archivos?',
        answer: 'Se entregan en PNG, JPG, SVG y AI vectorizado.',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  faqs?: Array<{ question: string; answer: string }>;

  @ApiPropertyOptional({
    example: [
      'Nombre de la empresa',
      'Sector',
      'Colores preferidos',
      'Referencias visuales',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiProperty({
    type: [CreatePackageDto],
    description: 'Mínimo 1 paquete (Básico, Estándar o Premium)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePackageDto)
  packages: CreatePackageDto[];

  @ApiPropertyOptional({ type: [CreateExtraDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExtraDto)
  extras?: CreateExtraDto[];
}
