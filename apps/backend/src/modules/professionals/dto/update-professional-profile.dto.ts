import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateProfessionalProfileDto {
  @ApiPropertyOptional({ example: 'Reformas Rápidas Madrid SL' })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional({ example: 'B12345678' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({
    example:
      'Más de 15 años de experiencia en pintura, fontanería y electricidad.',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 45.0 })
  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @ApiPropertyOptional({ example: 50, description: 'Radio de cobertura en km' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  serviceRadiusKm?: number;

  @ApiPropertyOptional({ example: 40.4168 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: -3.7038 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 'Madrid' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: '28001' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: 'España' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'Calle Alcalá 45' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: ['Fontanería', 'Electricidad', 'Calefacción'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ description: 'IDs de las categorías asociadas' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];
}

export class CreatePortfolioItemDto {
  @ApiPropertyOptional({ example: 'Reforma Integral de Cocina' })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: 'Renovación completa de tuberías, alicatado y muebles de diseño.',
  })
  @IsString()
  description: string;

  @ApiPropertyOptional({
    example: [
      'https://images.unsplash.com/kitchen1.jpg',
      'https://images.unsplash.com/kitchen2.jpg',
    ],
  })
  @IsArray()
  @IsString({ each: true })
  imageUrls: string[];

  @ApiPropertyOptional({ example: 'https://miportafolio.com/cocina' })
  @IsOptional()
  @IsString()
  projectUrl?: string;

  @ApiPropertyOptional({ example: ['Cocinas', 'Reformas'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class SubmitKycDto {
  @ApiPropertyOptional({
    example: 'https://storage.yewi.com/kyc/dni_pro_123.pdf',
    description: 'URL del documento de identidad / fiscal',
  })
  @IsString()
  documentUrl: string;
}
