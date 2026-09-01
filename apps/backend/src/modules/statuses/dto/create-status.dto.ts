import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatusMediaType } from '@prisma/client';

export class CreateStatusDto {
  @ApiPropertyOptional({ description: 'URL de imagen o vídeo del estado' })
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiPropertyOptional({ enum: StatusMediaType, default: StatusMediaType.IMAGE })
  @IsOptional()
  @IsEnum(StatusMediaType)
  mediaType?: StatusMediaType;

  @ApiPropertyOptional({ description: 'Pie de foto o texto explicativo', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;

  @ApiPropertyOptional({ description: 'Color de fondo hexadecimal para estados de solo texto' })
  @IsOptional()
  @IsString()
  backgroundColor?: string;
}
