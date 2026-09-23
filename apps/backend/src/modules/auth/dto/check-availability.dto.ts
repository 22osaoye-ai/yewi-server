import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CheckAvailabilityDto {
  @ApiPropertyOptional({
    example: 'juan.perez@ejemplo.com',
    description: 'Correo electrónico a comprobar',
  })
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
  email?: string;

  @ApiPropertyOptional({
    example: '+34600112233',
    description: 'Número de teléfono completo con prefijo internacional',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'España',
    description: 'País del número telefónico (España, Francia, Reino Unido)',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    example: '12345678Z',
    description: 'NIF, NIE o CIF español del profesional a comprobar',
  })
  @IsOptional()
  @IsString()
  taxId?: string;
}

export interface FieldAvailability {
  available: boolean;
  message: string;
  formatted?: string;
}

export interface CheckAvailabilityResult {
  email?: FieldAvailability;
  phoneNumber?: FieldAvailability;
  taxId?: FieldAvailability;
}
