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
}
