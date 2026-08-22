import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateGigOrderDto {
  @ApiProperty({
    example: 'ID_DEL_GIG_PACKAGE',
    description: 'ID del paquete seleccionado (Básico, Estándar o Premium)',
  })
  @IsString()
  @IsNotEmpty()
  gigPackageId: string;

  @ApiPropertyOptional({
    example: ['ID_EXTRA_1', 'ID_EXTRA_2'],
    description: 'IDs de extras opcionales añadidos',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  extraIds?: string[];

  @ApiPropertyOptional({
    example: {
      brandName: 'TechNova',
      preferredColors: 'Azul y Plata',
      targetAudience: 'Startups y desarrolladores',
    },
    description:
      'Respuestas a los requerimientos solicitados por el freelancer',
  })
  @IsOptional()
  @IsObject()
  requirementsAnswers?: Record<string, any>;
}

export class SubmitRequirementsDto {
  @ApiProperty({
    example: {
      brandName: 'TechNova',
      notes: 'Queremos un diseño minimalista.',
    },
  })
  @IsObject()
  requirementsAnswers: Record<string, any>;
}

export class SubmitDeliveryDto {
  @ApiProperty({
    example:
      'Hola! Aquí tienes la entrega final con los logotipos en todos los formatos vectoriales solicitados.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    example: ['https://storage.yewi.com/deliveries/logo_final.zip'],
  })
  @IsArray()
  @IsString({ each: true })
  attachmentUrls: string[];
}

export class RequestRevisionDto {
  @ApiProperty({
    example:
      'Por favor, ¿podrías ajustar el tono de azul para que sea un poco más oscuro y probar una variante con tipografía serif?',
  })
  @IsString()
  @IsNotEmpty()
  revisionNotes: string;
}

export class OpenDisputeDto {
  @ApiProperty({ example: 'El trabajo entregado no coincide con lo acordado' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({
    example:
      'El freelancer no respondió a los requerimientos y entregó una plantilla genérica.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    example: ['https://storage.yewi.com/disputes/prueba1.png'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceUrls?: string[];
}
