import { Controller, Get, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RawResponse } from '../../common/decorators/raw-response.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { DeleteNotificationsDto } from './dto/delete-notifications.dto';

@ApiTags('Notifications (Notificaciones & Alertas)')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @RawResponse()
  @ApiOperation({ summary: 'Obtener mis notificaciones' })
  @ApiResponse({
    status: 200,
    description: 'Lista de notificaciones recibidas',
  })
  async getMyNotifications(@CurrentUser('id') userId: string) {
    return this.notificationsService.getMyNotifications(userId);
  }

  @Get('unread-count')
  @RawResponse()
  @ApiOperation({ summary: 'Obtener número de notificaciones no leídas' })
  async getUnreadCount(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  async markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  async markAsRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.notificationsService.markAsRead(userId, id);
  }

  @Delete('batch')
  @ApiOperation({ summary: 'Eliminar múltiples notificaciones por lote' })
  async deleteBatch(
    @CurrentUser('id') userId: string,
    @Body() dto: DeleteNotificationsDto,
  ) {
    return this.notificationsService.deleteNotifications(userId, dto.ids);
  }

  @Delete('clear-all')
  @ApiOperation({ summary: 'Eliminar todas las notificaciones' })
  async clearAll(@CurrentUser('id') userId: string) {
    return this.notificationsService.deleteNotifications(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una notificación individual' })
  async deleteNotification(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.notificationsService.deleteNotification(userId, id);
  }
}

