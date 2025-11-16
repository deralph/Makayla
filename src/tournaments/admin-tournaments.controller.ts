import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';

@ApiTags('admin-tournaments')
@ApiBearerAuth()
@Controller('admin/tournaments')
@UseGuards(AdminAuthGuard)
export class AdminTournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a tournament' })
  async createTournament(@Body() createTournamentDto: CreateTournamentDto) {
    return this.tournamentsService.createTournament(createTournamentDto);
  }

  @Get()
  @ApiOperation({ summary: 'List tournaments' })
  async listTournaments() {
    return this.tournamentsService.getTournaments();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tournament details' })
  async getTournament(@Param('id') id: string) {
    return this.tournamentsService.getTournament(id);
  }
}
