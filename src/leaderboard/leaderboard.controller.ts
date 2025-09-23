import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { SubmitScoreDto } from './dto/submit-score.dto';
import { DeviceAuthGuard } from '../auth/guards/device-auth.guard';
import { Device } from '../common/decorators/device.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('leaderboard')
@ApiBearerAuth()
@Controller('api/leaderboard')
@UseGuards(DeviceAuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('global')
  @ApiOperation({ summary: 'Get global leaderboard' })
  @ApiResponse({
    status: 200,
    description: 'Leaderboard retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getGlobalLeaderboard(@Query('limit') limit: number = 50) {
    return this.leaderboardService.getGlobalLeaderboard(limit);
  }

  @Get('friends')
  @ApiOperation({ summary: 'Get friends leaderboard' })
  @ApiResponse({
    status: 200,
    description: 'Friends leaderboard retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFriendsLeaderboard(@Device() device: any) {
    return this.leaderboardService.getFriendsLeaderboard(device.deviceId);
  }

  @Post('submit')
  @ApiOperation({ summary: 'Submit score' })
  @ApiResponse({ status: 200, description: 'Score submitted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitScore(
    @Device() device: any,
    @Body() submitScoreDto: SubmitScoreDto,
  ) {
    return this.leaderboardService.submitScore(device.deviceId, submitScoreDto);
  }
}
