import { PrismaService } from '../../database/prisma.service';
export declare class NotificationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMyNotifications(userId: string): Promise<{
        id: string;
        createdAt: Date;
        type: import("@prisma/client").$Enums.NotificationType;
        title: string;
        link: string | null;
        userId: string;
        message: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        isRead: boolean;
    }[]>;
    getUnreadCount(userId: string): Promise<{
        unreadCount: number;
    }>;
    markAsRead(userId: string, id: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    markAllAsRead(userId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
}
