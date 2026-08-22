import { MessageType } from '@prisma/client';
export declare class SendMessageDto {
    conversationId: string;
    content: string;
    type?: MessageType;
    attachments?: string[];
    metadata?: Record<string, any>;
}
