import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invite, InviteDocument } from './schemas/invite.schema';
import { GenerateInviteDto } from './dto/generate-invite.dto';
import { ClaimInviteDto } from './dto/claim-invite.dto';
import { UserService } from '../user/user.service';
import { CoinsService } from '../coins/coins.service';
import { Helpers } from '../common/utils/helpers';

@Injectable()
export class InvitesService {
  constructor(
    @InjectModel(Invite.name) private inviteModel: Model<InviteDocument>,
    private readonly userService: UserService,
    private readonly coinsService: CoinsService,
  ) {}

  async generateInvite(deviceId: string, generateInviteDto: GenerateInviteDto) {
    const user = await this.userService.findByDeviceId(deviceId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate unique invite code
    const inviteCode = Helpers.generateRandomString(8);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire in 7 days

    const invite = new this.inviteModel({
      inviterDeviceId: deviceId,
      inviteCode,
      expiresAt,
    });

    await invite.save();

    return {
      inviteCode,
      inviteUrl: `https://makaylajam.com/invite/${inviteCode}`,
      expiresAt,
    };
  }

  async claimInvite(deviceId: string, claimInviteDto: ClaimInviteDto) {
    const user = await this.userService.findByDeviceId(deviceId);
    if (!user) {
      throw new Error('User not found');
    }

    // Find valid invite
    const invite = await this.inviteModel
      .findOne({
        inviteCode: claimInviteDto.inviteCode,
        expiresAt: { $gt: new Date() },
        rewarded: false,
      })
      .exec();

    if (!invite) {
      throw new BadRequestException('Invalid or expired invite code');
    }

    // Check if user is trying to claim their own invite
    if (invite.inviterDeviceId === deviceId) {
      throw new BadRequestException('Cannot claim your own invite');
    }

    // Check if already claimed this invite
    const alreadyClaimed = await this.inviteModel
      .findOne({
        inviteCode: claimInviteDto.inviteCode,
        inviteeDeviceId: deviceId,
      })
      .exec();

    if (alreadyClaimed) {
      throw new BadRequestException('Invite already claimed');
    }

    // Reward both inviter and invitee
    const rewardAmount = 5000; // Example reward amount

    // Reward invitee
    await this.coinsService.updateCoins(deviceId, {
      delta: rewardAmount,
      reason: 'invite_claim',
      opId: claimInviteDto.opId,
    });

    // Reward inviter
    await this.coinsService.updateCoins(invite.inviterDeviceId, {
      delta: rewardAmount,
      reason: 'invite_reward',
      opId: claimInviteDto.opId + '_inviter',
    });

    // Update invite record
    invite.inviteeDeviceId = deviceId;
    invite.rewarded = true;
    invite.claimedAt = new Date();
    await invite.save();

    // Add friend relationship
    await this.userService.addFriend(
      deviceId,
      invite.inviterDeviceId,
      rewardAmount,
    );
    await this.userService.addFriend(
      invite.inviterDeviceId,
      deviceId,
      rewardAmount,
    );

    return {
      success: true,
      reward: rewardAmount,
      newBalance: user.coins + rewardAmount,
    };
  }

  async getInviteStatus(deviceId: string) {
    const user = await this.userService.findByDeviceId(deviceId);
    if (!user) {
      throw new Error('User not found');
    }

    const sentInvites = await this.inviteModel
      .find({ inviterDeviceId: deviceId })
      .exec();
    const claimedInvites = sentInvites.filter((invite) => invite.rewarded);
    const pendingInvites = sentInvites.filter((invite) => !invite.rewarded);

    const claimableRewards = claimedInvites.length * 5000; // Example calculation

    return {
      sent: sentInvites.length,
      claimed: claimedInvites.length,
      pending: pendingInvites.length,
      claimableRewards,
    };
  }
}
