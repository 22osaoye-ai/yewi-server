import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...',
    description: 'Google ID Token o Clerk Session Token verificado criptográficamente',
  })
  @IsNotEmpty({ message: 'El idToken es obligatorio para iniciar sesión con Google' })
  @IsString()
  idToken: string;

  @ApiPropertyOptional({
    example: 'Amalio Osa',
    description: 'Nombre completo',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'https://lh3.googleusercontent.com/a/...',
    description: 'URL del avatar de Google',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    isArray: true,
    default: [UserRole.CLIENT],
    description: 'Roles del usuario',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];
}
