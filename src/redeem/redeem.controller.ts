import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RedeemService } from './redeem.service';
import { DeviceAuthGuard } from '../auth/guards/device-auth.guard';
import { Device } from '../common/decorators/device.decorator';
import { RedeemCodeDto } from './dto/redeem-code.dto';

@ApiTags('redeem')
@ApiBearerAuth()
@Controller('api/redeem')
@UseGuards(DeviceAuthGuard)
export class RedeemController {
  constructor(private readonly redeemService: RedeemService) {}

  @Post()
  @ApiOperation({ summary: 'Redeem a promotional code' })
  async redeem(@Device() device: any, @Body() redeemCodeDto: RedeemCodeDto) {
    return this.redeemService.redeemCode(device.deviceId, redeemCodeDto);
  }
}
