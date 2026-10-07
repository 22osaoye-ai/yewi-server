import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 'ID_DE_LA_CONVERSACION' })
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({
    example: 'Hola, tengo una pregunta sobre el estado del proyecto.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000, {
    message: 'El contenido del mensaje no puede superar los 4000 caracteres',
  })
  content: string;

  @ApiPropertyOptional({ enum: MessageType, default: MessageType.TEXT })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType = MessageType.TEXT;

  @ApiPropertyOptional({
    example: ['https://storage.yewi.com/attachments/doc1.pdf'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
