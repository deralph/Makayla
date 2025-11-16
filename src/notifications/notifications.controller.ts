import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { DeviceAuthGuard } from '../auth/guards/device-auth.guard';
import { Device } from '../common/decorators/device.decorator';
import { RegisterTokenDto } from './dto/register-token.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('api/notifications')
@UseGuards(DeviceAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a device push token' })
  async registerToken(
    @Device() device: any,
    @Body() registerTokenDto: RegisterTokenDto,
  ) {
    return this.notificationsService.registerToken(
      device.deviceId,
      registerTokenDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve pending notifications' })
  async pull(@Device() device: any) {
    return this.notificationsService.pullNotifications(device.deviceId);
  }
}
