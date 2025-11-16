import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TournamentsService } from './tournaments.service';
import { DeviceAuthGuard } from '../auth/guards/device-auth.guard';
import { Device } from '../common/decorators/device.decorator';
import { JoinTournamentDto } from './dto/join-tournament.dto';
import { SubmitScoreDto } from './dto/submit-score.dto';

@ApiTags('tournaments')
@ApiBearerAuth()
@Controller('api/tournaments')
@UseGuards(DeviceAuthGuard)
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get()
  @ApiOperation({ summary: 'List active tournaments' })
  async listTournaments() {
    return this.tournamentsService.getTournaments();
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join a tournament' })
  async joinTournament(
    @Device() device: any,
    @Param('id') id: string,
    @Body() joinTournamentDto: JoinTournamentDto,
  ) {
    return this.tournamentsService.joinTournament(
      device.deviceId,
      id,
      joinTournamentDto,
    );
  }

  @Post(':id/score')
  @ApiOperation({ summary: 'Submit a tournament score' })
  async submitScore(
    @Device() device: any,
    @Param('id') id: string,
    @Body() submitScoreDto: SubmitScoreDto,
  ) {
    return this.tournamentsService.submitScore(
      device.deviceId,
      id,
      submitScoreDto,
    );
  }

  @Get(':id/leaderboard')
  @ApiOperation({ summary: 'Get tournament leaderboard' })
  async getLeaderboard(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    return this.tournamentsService.getLeaderboard(
      id,
      limit ? Number(limit) : 50,
    );
  }
}
