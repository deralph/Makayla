import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';

@ApiTags('admin-notifications')
@ApiBearerAuth()
@Controller('admin/notifications')
@UseGuards(AdminAuthGuard)
export class AdminNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Queue a push notification' })
  async sendNotification(@Body() sendNotificationDto: SendNotificationDto) {
    return this.notificationsService.sendNotification(sendNotificationDto);
  }
}
