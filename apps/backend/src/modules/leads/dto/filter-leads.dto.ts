import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FilterLeadsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrar por ID de categoría' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por nombre o slug de categoría',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filtrar por ciudad' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Filtrar por urgencia' })
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar solo oportunidades dentro de mi radio de cobertura',
  })
  @IsOptional()
  @IsBoolean()
  onlyMatchingMyRadius?: boolean;
}
