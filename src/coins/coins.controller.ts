import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { CoinsService } from './coins.service';
import { UpdateCoinsDto } from './dto/update-coins.dto';
import { DeviceAuthGuard } from '../auth/guards/device-auth.guard';
import { Device } from '../common/decorators/device.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('coins')
@ApiBearerAuth()
@Controller('api/coins')
@UseGuards(DeviceAuthGuard)
export class CoinsController {
  constructor(private readonly coinsService: CoinsService) {}

  @Post('update')
  @ApiOperation({ summary: 'Update coins balance' })
  @ApiResponse({ status: 200, description: 'Coins updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateCoins(
    @Device() device: any,
    @Body() updateCoinsDto: UpdateCoinsDto,
  ) {
    return this.coinsService.updateCoins(device.deviceId, updateCoinsDto);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history' })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTransactions(
    @Device() device: any,
    @Query('limit') limit: number = 20,
    @Query('after') after?: string,
  ) {
    return this.coinsService.getTransactions(device.deviceId, limit, after);
  }
}
