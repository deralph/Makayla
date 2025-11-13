import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RedeemCode,
  RedeemCodeDocument,
} from './schemas/redeem-code.schema';
import { CreateCodeDto } from './dto/create-code.dto';
import { RedeemCodeDto } from './dto/redeem-code.dto';
import { UserService } from '../user/user.service';
import { CoinsService } from '../coins/coins.service';

@Injectable()
export class RedeemService {
  constructor(
    @InjectModel(RedeemCode.name)
    private readonly redeemCodeModel: Model<RedeemCodeDocument>,
    private readonly userService: UserService,
    private readonly coinsService: CoinsService,
  ) {}

  async createCode(createCodeDto: CreateCodeDto) {
    const code = new this.redeemCodeModel({
      code: createCodeDto.code.toUpperCase(),
      rewards: createCodeDto.rewards,
      maxUses: createCodeDto.maxUses || 1,
      expiresAt: createCodeDto.expiresAt
        ? new Date(createCodeDto.expiresAt)
        : undefined,
    });

    return code.save();
  }

  async redeemCode(deviceId: string, redeemCodeDto: RedeemCodeDto) {
    const codeValue = redeemCodeDto.code.toUpperCase();
    const code = await this.redeemCodeModel.findOne({ code: codeValue });

    if (!code) {
      throw new NotFoundException('Redeem code not found');
    }

    if (code.expiresAt && code.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Redeem code has expired');
    }

    if (code.usedBy.includes(deviceId)) {
      throw new BadRequestException('Code already redeemed by this device');
    }

    if (code.usedBy.length >= code.maxUses) {
      throw new BadRequestException('Redeem code has no remaining uses');
    }

    const user = await this.userService.findByDeviceId(deviceId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const rewardResult = await this.applyRewards(deviceId, user, code.rewards);

    code.usedBy.push(deviceId);
    await code.save();

    return {
      success: true,
      rewards: rewardResult.rewards,
      newBalance: rewardResult.newBalance,
    };
  }

  async listCodes() {
    return this.redeemCodeModel
      .find()
      .sort({ createdAt: -1 })
      .lean();
  }

  private async applyRewards(deviceId: string, user: any, rewards: any[]) {
    const updateDoc: any = { $inc: {}, $set: {}, $push: {} };
    let coinReward = 0;

    for (const reward of rewards) {
      switch (reward.type) {
        case 'coins':
          coinReward += reward.amount || 0;
          break;
        case 'booster': {
          const boosterType = reward.boosterType || 'generic';
          const amount = reward.amount || 1;
          updateDoc.$inc[`boosterInventory.${boosterType}`] =
            (updateDoc.$inc[`boosterInventory.${boosterType}`] || 0) + amount;
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
          const newEnergy = Math.min(user.energyLimit, (user.energy || 0) + amount);
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
      updatedUser = await this.userService.updateUserState(deviceId, cleanedUpdate);
    }

    if (coinReward > 0) {
      await this.coinsService.updateCoins(deviceId, {
        delta: coinReward,
        reason: 'redeem_code_reward',
        opId: `redeem_${deviceId}_${Date.now()}`,
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
}
