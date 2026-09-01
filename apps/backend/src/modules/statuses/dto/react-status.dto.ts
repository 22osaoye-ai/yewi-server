import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReactStatusDto {
  @ApiPropertyOptional({ description: 'Tipo de reacción: LIKE, FIRE, CLAP, HEART', default: 'LIKE' })
  @IsOptional()
  @IsString()
  reactionType?: string;
}
