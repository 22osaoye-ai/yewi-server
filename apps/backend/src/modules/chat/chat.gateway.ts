import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Cliente WebSocket conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente WebSocket desconectado: ${client.id}`);
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    await client.join(`conversation_${data.conversationId}`);
    this.logger.log(
      `Socket ${client.id} se unió a la sala conversation_${data.conversationId}`,
    );
    return { status: 'joined', conversationId: data.conversationId };
  }

  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    await client.leave(`conversation_${data.conversationId}`);
    return { status: 'left', conversationId: data.conversationId };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; dto: SendMessageDto },
  ) {
    try {
      const message = await this.chatService.sendMessage(data.userId, data.dto);

      // Emitir mensaje en tiempo real a la sala de la conversación
      this.server
        .to(`conversation_${data.dto.conversationId}`)
        .emit('new_message', message);

      return { status: 'delivered', message };
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Error al enviar mensaje';
      return { status: 'error', message: msg };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { conversationId: string; userId: string; isTyping: boolean },
  ) {
    client.to(`conversation_${data.conversationId}`).emit('user_typing', data);
  }
}
