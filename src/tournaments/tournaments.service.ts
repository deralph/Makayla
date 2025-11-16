import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tournament, TournamentDocument } from './schemas/tournament.schema';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { JoinTournamentDto } from './dto/join-tournament.dto';
import { SubmitScoreDto } from './dto/submit-score.dto';
import { UserService } from '../user/user.service';
import { CoinsService } from '../coins/coins.service';

@Injectable()
export class TournamentsService {
  constructor(
    @InjectModel(Tournament.name)
    private readonly tournamentModel: Model<TournamentDocument>,
    private readonly userService: UserService,
    private readonly coinsService: CoinsService,
  ) {}

  async createTournament(createTournamentDto: CreateTournamentDto) {
    const tournament = new this.tournamentModel({
      title: createTournamentDto.title,
      description: createTournamentDto.description,
      startDate: new Date(createTournamentDto.startDate),
      endDate: new Date(createTournamentDto.endDate),
      entryFee: createTournamentDto.entryFee || 0,
      rewards: createTournamentDto.rewards || {},
      status: 'scheduled',
      maxParticipants: Math.min(
        Math.max(createTournamentDto.maxParticipants ?? 10, 2),
        10,
      ),
    });

    return tournament.save();
  }

  async getTournaments() {
    const now = new Date();
    const tournaments = await this.tournamentModel
      .find({ endDate: { $gte: now } })
      .sort({ startDate: 1 })
      .lean();

    return tournaments.map((tournament) => ({
      id: tournament._id.toString(),
      title: tournament.title,
      description: tournament.description,
      entryFee: tournament.entryFee,
      maxParticipants: tournament.maxParticipants,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      status: this.getStatus(tournament, now),
    }));
  }

  async getTournament(id: string) {
    const tournament = await this.tournamentModel.findById(id).lean();
    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }
    return tournament;
  }

  async joinTournament(
    deviceId: string,
    tournamentId: string,
    joinTournamentDto: JoinTournamentDto,
  ) {
    const tournament = await this.tournamentModel.findById(tournamentId);
    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    const status = this.getStatus(tournament, new Date());
    if (status === 'completed') {
      throw new BadRequestException('Tournament is already completed');
    }
    if (status === 'scheduled' && tournament.startDate > new Date()) {
      throw new BadRequestException('Tournament has not started yet');
    }

    const user = await this.userService.findByDeviceId(deviceId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.banned) {
      throw new ForbiddenException('Banned users cannot join tournaments');
    }

    const participant = tournament.leaderboard.find(
      (entry) => entry.deviceId === deviceId,
    );

    if (participant) {
      return { success: true, alreadyJoined: true };
    }

    if (tournament.leaderboard.length >= tournament.maxParticipants) {
      throw new BadRequestException('Tournament is full');
    }

    if (tournament.entryFee > 0) {
      await this.coinsService.updateCoins(deviceId, {
        delta: -tournament.entryFee,
        reason: 'tournament_entry',
        opId:
          joinTournamentDto.opId ||
          `tournament_entry_${tournamentId}_${Date.now()}`,
      });
    }

    tournament.leaderboard.push({
      deviceId,
      coinsGenerated: 0,
      joinedAt: new Date(),
    });

    await tournament.save();
    return { success: true };
  }

  async submitScore(
    deviceId: string,
    tournamentId: string,
    submitScoreDto: SubmitScoreDto,
  ) {
    const tournament = await this.tournamentModel.findById(tournamentId);
    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    const status = this.getStatus(tournament, new Date());
    if (status !== 'running') {
      throw new BadRequestException('Tournament is not currently running');
    }

    const participant = tournament.leaderboard.find(
      (entry) => entry.deviceId === deviceId,
    );

    if (!participant) {
      throw new ForbiddenException(
        'Join the tournament before submitting scores',
      );
    }

    const currentCoins =
      typeof participant.coinsGenerated === 'number'
        ? participant.coinsGenerated
        : (participant as any).score || 0;

    if (submitScoreDto.coinsGenerated > currentCoins) {
      participant.coinsGenerated = submitScoreDto.coinsGenerated;
      if ('score' in participant) {
        (participant as any).score = participant.coinsGenerated;
      }
      participant.lastSubmissionAt = new Date();
      await tournament.save();
    }

    return {
      success: true,
      coinsGenerated:
        typeof participant.coinsGenerated === 'number'
          ? participant.coinsGenerated
          : (participant as any).score || 0,
    };
  }

  async getLeaderboard(tournamentId: string, limit: number = 50) {
    const tournament = await this.tournamentModel.findById(tournamentId).lean();
    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    const leaderboard = [...tournament.leaderboard]
      .map((entry) => ({
        ...entry,
        coinsGenerated:
          typeof entry.coinsGenerated === 'number'
            ? entry.coinsGenerated
            : (entry as any).score || 0,
      }))
      .sort((a, b) => b.coinsGenerated - a.coinsGenerated)
      .slice(0, limit)
      .map((entry, index) => ({
        rank: index + 1,
        deviceId: entry.deviceId,
        coinsGenerated: entry.coinsGenerated,
      }));

    const winner = leaderboard.length > 0 ? leaderboard[0] : undefined;

    return {
      tournament: {
        id: tournament._id.toString(),
        title: tournament.title,
        status: this.getStatus(tournament, new Date()),
        maxParticipants: tournament.maxParticipants,
        winner: winner
          ? {
              deviceId: winner.deviceId,
              coinsGenerated: winner.coinsGenerated,
            }
          : null,
      },
      leaderboard,
    };
  }

  private getStatus(tournament: Tournament, reference: Date) {
    if (reference < tournament.startDate) {
      return 'scheduled';
    }
    if (reference > tournament.endDate) {
      return 'completed';
    }
    return 'running';
  }
}
