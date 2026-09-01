import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class SendPhoneOtpDto {
  @ApiProperty({
    example: '+34612345678',
    description: 'Número de teléfono con prefijo internacional',
  })
  @IsString()
  @IsNotEmpty({ message: 'El número de teléfono es obligatorio' })
  phoneNumber: string;
}

export class VerifyPhoneOtpDto {
  @ApiProperty({
    example: '+34612345678',
    description: 'Número de teléfono',
  })
  @IsString()
  @IsNotEmpty({ message: 'El número de teléfono es obligatorio' })
  phoneNumber: string;

  @ApiProperty({
    example: '123456',
    description: 'Código de 6 dígitos recibido por SMS',
  })
  @IsString()
  @Length(4, 6, { message: 'El código OTP debe tener entre 4 y 6 dígitos' })
  code: string;

  @ApiPropertyOptional({
    enum: UserRole,
    isArray: true,
    default: [UserRole.CLIENT],
    description: 'Roles del usuario si es nuevo registro',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];

  @ApiPropertyOptional({ example: 'Juan', description: 'Nombre' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Pérez', description: 'Apellidos' })
  @IsOptional()
  @IsString()
  lastName?: string;
}
