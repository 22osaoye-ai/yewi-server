import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 'ID_DEL_PEDIDO_COMPLETADO' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    example: 5,
    minimum: 1,
    maximum: 5,
    description: 'Calificación general (1 a 5)',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    example: 5,
    minimum: 1,
    maximum: 5,
    description: 'Calidad del trabajo',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  qualityRating: number;

  @ApiProperty({
    example: 5,
    minimum: 1,
    maximum: 5,
    description: 'Comunicación y claridad',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  communicationRating: number;

  @ApiProperty({
    example: 5,
    minimum: 1,
    maximum: 5,
    description: 'Puntualidad en la entrega',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  deliveryRating: number;

  @ApiProperty({
    example:
      '¡Excelente profesional! Entregó el trabajo antes de tiempo y con una calidad insuperable. Totalmente recomendado.',
  })
  @IsString()
  @IsNotEmpty()
  comment: string;
}

export class ReplyReviewDto {
  @ApiProperty({
    example:
      '¡Muchas gracias por confiar en mi trabajo! Ha sido un placer colaborar juntos.',
  })
  @IsString()
  @IsNotEmpty()
  reply: string;
}
