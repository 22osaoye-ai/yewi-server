import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
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

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : '*';

@WebSocketGateway({
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Autenticación estricta en el handshake de conexión WebSocket
   */
  async handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token ??
      client.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      this.logger.warn(`Conexión rechazada a /chat: falta token (${client.id})`);
      client.disconnect();
      return;
    }

    try {
      const secret =
        this.configService.get<string>('JWT_SECRET') || process.env.JWT_SECRET;
      if (!secret) {
        this.logger.error('JWT_SECRET no configurado en el backend');
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token, {
        secret,
      });

      if (!payload.sub) {
        this.logger.warn(`Conexión rechazada a /chat: payload sin sub (${client.id})`);
        client.disconnect();
        return;
      }

      client.data.userId = payload.sub;
      this.logger.log(
        `Cliente WebSocket autenticado en /chat: usuario ${payload.sub} (socket: ${client.id})`,
      );
    } catch {
      this.logger.warn(`Conexión rechazada a /chat: token JWT inválido (${client.id})`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente WebSocket desconectado de /chat: ${client.id}`);
  }

  /**
   * Unirse a una conversación tras validar que el usuario es participante legítimo
   */
  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) {
      client.disconnect();
      return { status: 'unauthorized', message: 'No autenticado' };
    }

    if (!data?.conversationId) {
      return { status: 'error', message: 'conversationId es requerido' };
    }

    const isMember = await this.chatService.isParticipant(
      data.conversationId,
      userId,
    );

    if (!isMember) {
      this.logger.warn(
        `Usuario ${userId} intentó unirse a la conversación ${data.conversationId} sin autorización`,
      );
      return {
        status: 'forbidden',
        message: 'No tienes autorización para acceder a esta conversación',
      };
    }

    await client.join(`conversation_${data.conversationId}`);
    this.logger.log(
      `Usuario ${userId} se unió a conversation_${data.conversationId}`,
    );
    return { status: 'joined', conversationId: data.conversationId };
  }

  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (data?.conversationId) {
      await client.leave(`conversation_${data.conversationId}`);
    }
    return { status: 'left', conversationId: data?.conversationId };
  }

  /**
   * Enviar mensaje usando exclusivamente el userId autenticado de la sesión Socket
   */
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { dto: SendMessageDto } | { userId?: string; dto: SendMessageDto },
  ) {
    const userId = client.data.userId;
    if (!userId) {
      client.disconnect();
      return { status: 'unauthorized', message: 'No autenticado' };
    }

    const dto = 'dto' in data && data.dto ? data.dto : (data as unknown as SendMessageDto);
    if (!dto || !dto.conversationId || !dto.content || typeof dto.content !== 'string') {
      return { status: 'error', message: 'Datos de mensaje incompletos' };
    }

    if (dto.content.length > 4000) {
      return {
        status: 'error',
        message: 'El contenido del mensaje excede el límite máximo de 4000 caracteres',
      };
    }

    try {
      // Usar SIEMPRE client.data.userId autenticado, ignorando cualquier userId enviado en el payload
      const message = await this.chatService.sendMessage(userId, dto);

      // Emitir mensaje en tiempo real a la sala de la conversación
      this.server
        .to(`conversation_${dto.conversationId}`)
        .emit('new_message', message);

      return { status: 'delivered', message };
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Error al enviar mensaje';
      return { status: 'error', message: msg };
    }
  }

  /**
   * Notificar estado 'escribiendo' verificando pertenencia a la conversación
   */
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { conversationId: string; isTyping: boolean },
  ) {
    const userId = client.data.userId;
    if (!userId || !data?.conversationId) {
      return;
    }

    const isMember = await this.chatService.isParticipant(
      data.conversationId,
      userId,
    );
    if (!isMember) {
      return;
    }

    client.to(`conversation_${data.conversationId}`).emit('user_typing', {
      conversationId: data.conversationId,
      userId,
      isTyping: !!data.isTyping,
    });
  }
}
