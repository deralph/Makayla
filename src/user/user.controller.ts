import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { DeviceAuthGuard } from '../auth/guards/device-auth.guard';
import { Device } from '../common/decorators/device.decorator';
import { SyncUserStateDto } from './dto/sync-user-state.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('api/user')
@UseGuards(DeviceAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('state')
  @ApiOperation({ summary: 'Get full user state' })
  @ApiResponse({
    status: 200,
    description: 'User state retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getFullState(@Device() device: any) {
    return this.userService.getFullState(device.deviceId);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync user state' })
  @ApiResponse({ status: 200, description: 'State synced successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async syncState(
    @Device() device: any,
    @Body() syncUserStateDto: SyncUserStateDto,
  ) {
    return this.userService.syncState(device.deviceId, syncUserStateDto);
  }

  @Get('minimal')
  @ApiOperation({ summary: 'Get minimal user state' })
  @ApiResponse({
    status: 200,
    description: 'Minimal state retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getMinimalState(@Device() device: any) {
    return this.userService.getMinimalState(device.deviceId);
  }
}
