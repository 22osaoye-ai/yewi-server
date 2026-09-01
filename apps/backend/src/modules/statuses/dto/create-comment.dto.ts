import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStatusCommentDto {
  @ApiProperty({ description: 'Contenido del comentario', maxLength: 300 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  content: string;
}
