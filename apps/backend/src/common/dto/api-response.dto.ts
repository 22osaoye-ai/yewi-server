import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: '2026-08-21T20:30:00.000Z' })
  timestamp: string;

  @ApiProperty({ description: 'Datos devueltos por la API' })
  data: T;

  @ApiProperty({
    required: false,
    description: 'Metadatos adicionales o de paginación',
  })
  meta?: Record<string, any>;
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: '2026-08-21T20:30:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/auth/login' })
  path: string;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({ example: 'Credenciales inválidas' })
  message: string | string[];

  @ApiProperty({ required: false })
  details?: any;
}
