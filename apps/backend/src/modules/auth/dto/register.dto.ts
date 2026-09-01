import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'juan.perez@ejemplo.com',
    description: 'Correo electrónico único',
  })
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
  email: string;

  @ApiProperty({
    example: 'Password123!#',
    minLength: 8,
    description: 'Contraseña segura',
  })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @ApiProperty({ example: 'Juan', description: 'Nombre' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  firstName: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellidos' })
  @IsString()
  @IsNotEmpty({ message: 'Los apellidos son obligatorios' })
  lastName: string;

  @ApiPropertyOptional({
    enum: UserRole,
    isArray: true,
    default: [UserRole.CLIENT],
    description: 'Roles iniciales del usuario',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[] = [UserRole.CLIENT];

  @ApiPropertyOptional({
    example: '+34600112233',
    description: 'Teléfono de contacto con prefijo oficial (+34, +33, +44)',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'España',
    description: 'País de residencia autorizado (España, Francia, Reino Unido)',
  })
  @IsOptional()
  @IsString()
  country?: string;

  // Datos opcionales si se registra directamente como profesional
  @ApiPropertyOptional({
    example: 'Reformas y Fontanería Express',
    description: 'Nombre comercial (si es profesional)',
  })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional({
    example:
      'Especialista en reformas integrales y fontanería con 10 años de experiencia.',
    description: 'Biografía profesional',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 40.4168, description: 'Latitud geográfica' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: -3.7038, description: 'Longitud geográfica' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Radio de cobertura en kilómetros',
  })
  @IsOptional()
  @IsNumber()
  serviceRadiusKm?: number;

  @ApiPropertyOptional({ example: 'Zaragoza', description: 'Ciudad' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: '50001', description: 'Código postal' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({
    example: 'Calle Alfonso I, 14',
    description: 'Dirección',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 35.0,
    description: 'Tarifa horaria estimada',
  })
  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @ApiPropertyOptional({
    example: ['Fontanería', 'Electricidad'],
    description: 'Especialidades',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];
}
