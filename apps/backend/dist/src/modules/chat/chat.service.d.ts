import { PrismaService } from '../../database/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
export declare class ChatService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findOrCreateConversation(userId: string, targetId: string): Promise<{
        id: string;
        orderId: string | null;
        serviceRequestId: string | null;
        participantAId: string;
        participantBId: string;
        lastMessageAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    getMyConversations(userId: string): Promise<({
        order: {
            id: string;
            orderNumber: string;
            status: import("@prisma/client").$Enums.OrderStatus;
        } | null;
        serviceRequest: {
            id: string;
            title: string;
        } | null;
        messages: {
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
        }[];
    } & {
        id: string;
        orderId: string | null;
        serviceRequestId: string | null;
        participantAId: string;
        participantBId: string;
        lastMessageAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getMessages(userId: string, conversationOrOrderId: string): Promise<{
        conversationId: string;
        orderId: string | null;
        messages: ({
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
        })[];
    }>;
    sendMessage(userId: string, dto: SendMessageDto): Promise<{
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
    }>;
}
