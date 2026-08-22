import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly chatService;
    server: Server;
    private readonly logger;
    constructor(chatService: ChatService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinConversation(client: Socket, data: {
        conversationId: string;
    }): Promise<{
        status: string;
        conversationId: string;
    }>;
    handleLeaveConversation(client: Socket, data: {
        conversationId: string;
    }): Promise<{
        status: string;
        conversationId: string;
    }>;
    handleSendMessage(client: Socket, data: {
        userId: string;
        dto: SendMessageDto;
    }): Promise<{
        status: string;
        message: {
            sender: {
                id: string;
                profile: {
                    firstName: string;
                    lastName: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            id: string;
            createdAt: Date;
            conversationId: string;
            senderId: string;
            type: import("@prisma/client").$Enums.MessageType;
            content: string;
            attachments: string[];
            metadata: import("@prisma/client/runtime/client").JsonValue | null;
            isRead: boolean;
            readAt: Date | null;
        };
    } | {
        status: string;
        message: string;
    }>;
    handleTyping(client: Socket, data: {
        conversationId: string;
        userId: string;
        isTyping: boolean;
    }): void;
}
