import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'juan.perez@ejemplo.com',
    description: 'Correo electrónico',
  })
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
  email: string;

  @ApiProperty({ example: 'Password123!#', description: 'Contraseña' })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh Token JWT válido' })
  @IsString()
  @IsNotEmpty({ message: 'El refresh token es obligatorio' })
  refreshToken: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'juan.perez@ejemplo.com',
    description: 'Correo registrado',
  })
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token de restablecimiento recibido por email' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'NewSecurePassword123!',
    minLength: 8,
    description: 'Nueva contraseña',
  })
  @IsString()
  @MinLength(8, {
    message: 'La nueva contraseña debe tener al menos 8 caracteres',
  })
  newPassword: string;
}
