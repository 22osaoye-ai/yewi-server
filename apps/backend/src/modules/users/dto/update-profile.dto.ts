import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Juan' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Pérez García' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'Juan P.' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: '+34600112233' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s\-()]{7,20}$/, {
    message: 'El teléfono debe ser un número de contacto válido.',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'España' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'Aragón' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ example: 'Zaragoza' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({ example: 'Zaragoza' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: '50001' })
  @IsOptional()
  @IsString()
  @Matches(/^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/, {
    message:
      'El código postal debe tener 5 dígitos válidos en España (entre 01000 y 52999).',
  })
  postalCode?: string;

  @ApiPropertyOptional({ example: 'Gran Vía 12' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Biografía del usuario' })
  @IsOptional()
  @IsString()
  bio?: string;
}
