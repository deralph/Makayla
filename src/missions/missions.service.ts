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

    if (mission.type === 'social') {
      const rewardsClaimed = user.missions.social.rewardsClaimed || {};
      if (rewardsClaimed[mission._id.toString()]) {
        throw new BadRequestException('Social mission reward already claimed');
      }
    }

    const rewardSummary = await this.applyMissionRewards(
      deviceId,
      user,
      mission,
      claimMissionDto.opId,
    );

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
    } else if (mission.type === 'social') {
      const rewardsClaimed = {
        ...(user.missions.social.rewardsClaimed || {}),
        [mission._id.toString()]: true,
      };

      await this.userService.updateUserState(deviceId, {
        $set: {
          'missions.social.rewardsClaimed': rewardsClaimed,
        },
      });
    }

    return {
      success: true,
      rewards: rewardSummary.rewards,
      newBalance: rewardSummary.newBalance,
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
      const rewardsClaimed = user.missions.social.rewardsClaimed || {};
      const missionId = mission._id.toString();
      if (rewardsClaimed[missionId]) {
        return 'claimed';
      }
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

  private async applyMissionRewards(
    deviceId: string,
    user: any,
    mission: MissionDocument,
    opId: string,
  ) {
    if (
      mission.type === 'social' &&
      !this.isSocialMissionCompleted(user, mission)
    ) {
      throw new BadRequestException('Mission requirements not fulfilled yet');
    }

    const rewards =
      mission.rewards && mission.rewards.length > 0
        ? mission.rewards
        : [{ type: 'coins', amount: mission.reward }];

    let totalCoinReward = 0;
    const updateDoc: any = { $inc: {}, $set: {}, $push: {} };

    for (const reward of rewards) {
      switch (reward.type) {
        case 'coins': {
          totalCoinReward += reward.amount || 0;
          break;
        }
        case 'booster': {
          const boosterType =
            reward.boosterType || reward.typeName || 'generic';
          const amount = reward.amount || 1;
          if (amount > 0) {
            updateDoc.$inc[`boosterInventory.${boosterType}`] =
              (updateDoc.$inc[`boosterInventory.${boosterType}`] || 0) + amount;
          }
          if (reward.durationMinutes) {
            const expiresAt = new Date(
              Date.now() + reward.durationMinutes * 60000,
            );
            updateDoc.$push.activeBoosters = {
              boosterType,
              multiplier: reward.multiplier,
              expiresAt,
            };
          }
          break;
        }
        case 'energy': {
          const amount = reward.amount ?? user.energyLimit;
          const newEnergy = Math.min(
            user.energyLimit,
            (user.energy || 0) + amount,
          );
          updateDoc.$set.energy = newEnergy;
          break;
        }
        default:
          break;
      }
    }

    const cleanedUpdate = this.cleanUpdateDoc(updateDoc);
    let updatedUser = user;
    if (Object.keys(cleanedUpdate).length > 0) {
      updatedUser = await this.userService.updateUserState(
        deviceId,
        cleanedUpdate,
      );
    }

    if (totalCoinReward > 0) {
      await this.coinsService.updateCoins(deviceId, {
        delta: totalCoinReward,
        reason: `mission_${mission.type}_reward`,
        opId,
      });
      updatedUser = await this.userService.findByDeviceId(deviceId);
    }

    return {
      rewards,
      newBalance: updatedUser.coins,
    };
  }

  private cleanUpdateDoc(updateDoc: Record<string, any>) {
    return Object.fromEntries(
      Object.entries(updateDoc).filter(([, value]) => {
        if (value == null) return false;
        if (typeof value === 'object') {
          if (Array.isArray(value) && value.length === 0) {
            return false;
          }
          return Object.keys(value).length > 0;
        }
        return true;
      }),
    );
  }

  private isSocialMissionCompleted(user: any, mission: MissionDocument) {
    const platform = mission.meta?.platform;
    if (!platform) {
      return true;
    }

    if (platform === 'telegram') {
      return !!user.missions.social.telegramJoined;
    }
    if (platform === 'x') {
      return !!user.missions.social.xFollowed;
    }
    if (platform === 'share') {
      return !!user.missions.social.postShared;
    }
    return true;
  }
}
