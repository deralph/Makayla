import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { MediaService } from './media.service';
import { ClaimMediaDto } from './dto/claim-media.dto';
import { DeviceAuthGuard } from '../auth/guards/device-auth.guard';
import { Device } from '../common/decorators/device.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('media')
@ApiBearerAuth()
@Controller('api/media')
@UseGuards(DeviceAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('claim')
  @ApiOperation({ summary: 'Claim media reward' })
  @ApiResponse({
    status: 200,
    description: 'Media reward claimed successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid media claim' })
  async claimMedia(
    @Device() device: any,
    @Body() claimMediaDto: ClaimMediaDto,
  ) {
    return this.mediaService.claimMedia(device.deviceId, claimMediaDto);
  }
}
