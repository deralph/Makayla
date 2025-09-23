import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Mission, MissionDocument } from './schemas/mission.schema';
import { ClaimMissionDto } from './dto/claim-mission.dto';
import { CompleteMissionDto } from './dto/complete-mission.dto';
import { UserService } from '../user/user.service';
import { CoinsService } from '../coins/coins.service';

@Injectable()
export class MissionsService {
  constructor(
    @InjectModel(Mission.name) private missionModel: Model<MissionDocument>,
    private readonly userService: UserService,
    private readonly coinsService: CoinsService,
  ) {}

  async getMissions(deviceId: string) {
    const user = await this.userService.findByDeviceId(deviceId);
    if (!user) {
      throw new Error('User not found');
    }

    const missions = await this.missionModel.find({ active: true }).exec();

    return {
      daily: {
        dayIndex: this.getCurrentDayIndex(),
        claimed: user.missions.daily || [],
      },
      tasks: missions.map((mission) => ({
        id: mission._id.toString(),
        type: mission.type,
        status: this.getMissionStatus(user, mission),
        reward: mission.reward,
        requirements: mission.conditions,
      })),
    };
  }

  async claimMission(deviceId: string, claimMissionDto: ClaimMissionDto) {
    const user = await this.userService.findByDeviceId(deviceId);
    if (!user) {
      throw new Error('User not found');
    }

    const mission = await this.missionModel
      .findById(claimMissionDto.missionId)
      .exec();
    if (!mission) {
      throw new BadRequestException('Mission not found');
    }

    // Check if mission is already claimed
    if (mission.type === 'daily') {
      const dayIndex = claimMissionDto.dayIndex || this.getCurrentDayIndex();
      const dailyMission = user.missions.daily.find((d) => d.day === dayIndex);

      if (dailyMission && dailyMission.claimed) {
        throw new BadRequestException('Daily mission already claimed');
      }
    }

    // Award coins
    await this.coinsService.updateCoins(deviceId, {
      delta: mission.reward,
      reason: `mission_${mission.type}_reward`,
      opId: claimMissionDto.opId,
    });

    // Update mission status
    if (mission.type === 'daily') {
      const dayIndex = claimMissionDto.dayIndex || this.getCurrentDayIndex();
      const dailyMissions = user.missions.daily.filter(
        (d) => d.day !== dayIndex,
      );
      dailyMissions.push({ day: dayIndex, claimed: true });

      await this.userService.updateUserState(deviceId, {
        missions: { ...user.missions, daily: dailyMissions },
      } as any);
    }

    return {
      success: true,
      reward: mission.reward,
      newBalance: user.coins + mission.reward,
      missionState: mission.type === 'daily' ? 'claimed' : 'completed',
    };
  }

  async completeMission(
    deviceId: string,
    completeMissionDto: CompleteMissionDto,
  ) {
    const user = await this.userService.findByDeviceId(deviceId);
    if (!user) {
      throw new Error('User not found');
    }

    const mission = await this.missionModel
      .findById(completeMissionDto.missionId)
      .exec();
    if (!mission) {
      throw new BadRequestException('Mission not found');
    }

    // For missions that require server verification
    if (mission.type === 'social') {
      // Verify the evidence (e.g., check if user followed on social media)
      const verified = await this.verifySocialMission(
        completeMissionDto.evidence,
      );

      if (!verified) {
        throw new BadRequestException('Mission verification failed');
      }

      // Update user's social mission status
      const socialMissions = { ...user.missions.social };

      if (mission.meta.platform === 'telegram') {
        socialMissions.telegramJoined = true;
      } else if (mission.meta.platform === 'x') {
        socialMissions.xFollowed = true;
      } else if (mission.meta.platform === 'share') {
        socialMissions.postShared = true;
      }

      await this.userService.updateUserState(deviceId, {
        missions: { ...user.missions, social: socialMissions },
      } as any);
    }

    return {
      success: true,
      missionState: 'completed',
    };
  }

  private getCurrentDayIndex(): number {
    // Simple implementation - returns day of month
    return new Date().getDate();
  }

  private getMissionStatus(user: any, mission: MissionDocument): string {
    if (mission.type === 'daily') {
      const dayIndex = this.getCurrentDayIndex();
      const dailyMission = user.missions.daily.find((d) => d.day === dayIndex);
      return dailyMission?.claimed ? 'claimed' : 'available';
    } else if (mission.type === 'social') {
      const platform = mission.meta.platform;
      if (platform === 'telegram')
        return user.missions.social.telegramJoined ? 'completed' : 'available';
      if (platform === 'x')
        return user.missions.social.xFollowed ? 'completed' : 'available';
      if (platform === 'share')
        return user.missions.social.postShared ? 'completed' : 'available';
    }
    return 'available';
  }

  private async verifySocialMission(evidence: any): Promise<boolean> {
    // In a real implementation, this would verify with social media APIs
    // For now, we'll just return true for demonstration
    return true;
  }
}
