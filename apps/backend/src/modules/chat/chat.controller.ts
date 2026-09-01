import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('Chat (Mensajería en Tiempo Real, Archivos & Anti-Fraude)')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('stream-token')
  @ApiOperation({ summary: 'Generar token seguro de Stream Chat para el cliente autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Token de Stream Chat, API key y metadatos de usuario',
  })
  async getStreamToken(@CurrentUser('id') userId: string) {
    return this.chatService.getStreamToken(userId);
  }

  @Get('contacts')
  @ApiOperation({ summary: 'Obtener lista de contactos reales para iniciar o continuar chats' })
  @ApiResponse({
    status: 200,
    description: 'Lista de contactos reales y profesionales verificados',
  })
  async getContacts(@CurrentUser('id') userId: string) {
    return this.chatService.getContacts(userId);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Listar todas mis conversaciones activas' })
  @ApiResponse({
    status: 200,
    description:
      'Lista de conversaciones con último mensaje y estado del pedido',
  })
  async getMyConversations(@CurrentUser('id') userId: string) {
    return this.chatService.getMyConversations(userId);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({
    summary: 'Obtener historial de mensajes de una conversación',
  })
  async getMessages(
    @CurrentUser('id') userId: string,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.getMessages(userId, conversationId);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Enviar mensaje vía REST (o vía WebSocket)' })
  @ApiResponse({
    status: 201,
    description:
      'Mensaje enviado y filtrado anti-fraude aplicado si corresponde',
  })
  async sendMessage(
    @CurrentUser('id') userId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(userId, dto);
  }

  @Post('messages/:id/reaction')
  @ApiOperation({ summary: 'Añadir o retirar reacción de emoji a un mensaje' })
  @ApiResponse({
    status: 200,
    description: 'Reacción actualizada y emitida en tiempo real',
  })
  async toggleReaction(
    @CurrentUser('id') userId: string,
    @Param('id') messageId: string,
    @Body('emoji') emoji: string,
  ) {
    return this.chatService.toggleReaction(userId, messageId, emoji);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Subir archivo adjunto para el chat (imagen, PDF, Excel)' })
  @ApiResponse({
    status: 201,
    description: 'Archivo subido y metadatos de adjunto generados',
  })
  async uploadAttachment(
    @CurrentUser('id') userId: string,
    @Body() body: { file: string; fileName?: string; mimeType?: string; size?: number },
  ) {
    return this.chatService.uploadAttachment(
      userId,
      body.file,
      body.fileName,
      body.mimeType,
      body.size,
    );
  }
}

