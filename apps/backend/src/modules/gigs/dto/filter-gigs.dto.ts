import { ApiPropertyOptional } from '@nestjs/swagger';
import { GigStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { CreateExtraDto, CreatePackageDto } from './create-gig.dto';

export class UpdateGigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  searchTags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  coverImages?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  faqs?: Array<{ question: string; answer: string }>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiPropertyOptional({ enum: GigStatus })
  @IsOptional()
  @IsEnum(GigStatus)
  status?: GigStatus;

  @ApiPropertyOptional({ type: [CreatePackageDto] })
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

export class FilterGigsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrar por ID o slug de categoría' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Precio mínimo de paquete' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Precio máximo de paquete' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Plazo máximo de entrega en días' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  deliveryDays?: number;

  @ApiPropertyOptional({ description: 'Calificación mínima (1 a 5)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minRating?: number;

  @ApiPropertyOptional({ description: 'Solo gigs destacados' })
  @IsOptional()
  isFeatured?: boolean;
}
