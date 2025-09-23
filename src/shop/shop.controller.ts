import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ShopService } from './shop.service';
import { PurchaseItemDto } from './dto/purchase-item.dto';
import { DeviceAuthGuard } from '../auth/guards/device-auth.guard';
import { Device } from '../common/decorators/device.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('shop')
@ApiBearerAuth()
@Controller('api/shop')
@UseGuards(DeviceAuthGuard)
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('items')
  @ApiOperation({ summary: 'Get shop items' })
  @ApiResponse({
    status: 200,
    description: 'Shop items retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getItems() {
    return this.shopService.getItems();
  }

  @Post('purchase')
  @ApiOperation({ summary: 'Purchase item' })
  @ApiResponse({ status: 200, description: 'Item purchased successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Insufficient coins' })
  async purchaseItem(
    @Device() device: any,
    @Body() purchaseItemDto: PurchaseItemDto,
  ) {
    return this.shopService.purchaseItem(device.deviceId, purchaseItemDto);
  }
}
