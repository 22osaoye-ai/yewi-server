import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount: count };
  }

  async markAsRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async deleteNotification(userId: string, id: string) {
    const result = await this.prisma.notification.deleteMany({
      where: { id, userId },
    });
    return { success: true, count: result.count };
  }

  async deleteNotifications(userId: string, ids?: string[]) {
    if (ids && ids.length > 0) {
      const result = await this.prisma.notification.deleteMany({
        where: { id: { in: ids }, userId },
      });
      return { success: true, count: result.count };
    }
    const result = await this.prisma.notification.deleteMany({
      where: { userId },
    });
    return { success: true, count: result.count };
  }
}

