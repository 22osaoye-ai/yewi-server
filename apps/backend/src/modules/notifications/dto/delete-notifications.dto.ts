import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class DeleteNotificationsDto {
  @ApiPropertyOptional({
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    description: 'Array de IDs de notificaciones a eliminar. Si está vacío o no se envía, elimina todas.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ids?: string[];
}
