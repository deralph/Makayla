import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GiftingService } from './gifting.service';
import { DeviceAuthGuard } from '../auth/guards/device-auth.guard';
import { Device } from '../common/decorators/device.decorator';
import { SendGiftDto } from './dto/send-gift.dto';

@ApiTags('gifting')
@ApiBearerAuth()
@Controller('api/gifting')
@UseGuards(DeviceAuthGuard)
export class GiftingController {
  constructor(private readonly giftingService: GiftingService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send a coin gift to another player' })
  async sendGift(@Device() device: any, @Body() sendGiftDto: SendGiftDto) {
    return this.giftingService.sendGift(device.deviceId, sendGiftDto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get recent gift history' })
  async history(@Device() device: any) {
    return this.giftingService.getGiftHistory(device.deviceId);
  }
}
