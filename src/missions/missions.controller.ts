import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { MissionsService } from './missions.service';
import { ClaimMissionDto } from './dto/claim-mission.dto';
import { CompleteMissionDto } from './dto/complete-mission.dto';
import { DeviceAuthGuard } from '../auth/guards/device-auth.guard';
import { Device } from '../common/decorators/device.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('missions')
@ApiBearerAuth()
@Controller('api/missions')
@UseGuards(DeviceAuthGuard)
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get missions' })
  @ApiResponse({ status: 200, description: 'Missions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMissions(@Device() device: any) {
    return this.missionsService.getMissions(device.deviceId);
  }

  @Post('claim')
  @ApiOperation({ summary: 'Claim mission reward' })
  @ApiResponse({
    status: 200,
    description: 'Mission reward claimed successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 400,
    description: 'Mission not completed or already claimed',
  })
  async claimMission(
    @Device() device: any,
    @Body() claimMissionDto: ClaimMissionDto,
  ) {
    return this.missionsService.claimMission(device.deviceId, claimMissionDto);
  }

  @Post('complete')
  @ApiOperation({ summary: 'Complete mission' })
  @ApiResponse({ status: 200, description: 'Mission completed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async completeMission(
    @Device() device: any,
    @Body() completeMissionDto: CompleteMissionDto,
  ) {
    return this.missionsService.completeMission(
      device.deviceId,
      completeMissionDto,
    );
  }
}
