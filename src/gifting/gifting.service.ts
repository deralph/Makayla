import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Gift, GiftDocument } from './schemas/gift.schema';
import { SendGiftDto } from './dto/send-gift.dto';
import { UserService } from '../user/user.service';
import { CoinsService } from '../coins/coins.service';

@Injectable()
export class GiftingService {
  constructor(
    @InjectModel(Gift.name) private readonly giftModel: Model<GiftDocument>,
    private readonly userService: UserService,
    private readonly coinsService: CoinsService,
  ) {}

  async sendGift(deviceId: string, sendGiftDto: SendGiftDto) {
    if (deviceId === sendGiftDto.recipientDeviceId) {
      throw new BadRequestException('Cannot gift yourself');
    }

    const [sender, recipient] = await Promise.all([
      this.userService.findByDeviceId(deviceId),
      this.userService.findByDeviceId(sendGiftDto.recipientDeviceId),
    ]);

    if (!sender) {
      throw new NotFoundException('Sender not found');
    }
    if (!recipient) {
      throw new NotFoundException('Recipient not found');
    }
    if (sender.banned) {
      throw new ForbiddenException('Banned users cannot send gifts');
    }

    if (sender.coins < sendGiftDto.amount) {
      throw new BadRequestException('Insufficient balance to gift');
    }

    const opId =
      sendGiftDto.opId ||
      `gift_${deviceId}_${Date.now()}_${sendGiftDto.amount}`;

    await this.coinsService.updateCoins(deviceId, {
      delta: -sendGiftDto.amount,
      reason: 'gift_send',
      opId,
    });

    await this.coinsService.updateCoins(sendGiftDto.recipientDeviceId, {
      delta: sendGiftDto.amount,
      reason: 'gift_receive',
      opId: `${opId}_receive`,
    });

    const gift = new this.giftModel({
      senderDeviceId: deviceId,
      recipientDeviceId: sendGiftDto.recipientDeviceId,
      amount: sendGiftDto.amount,
      reason: 'coins',
      status: 'completed',
    });

    await gift.save();

    return { success: true, giftId: gift._id };
  }

  async getGiftHistory(deviceId: string) {
    const gifts = await this.giftModel
      .find({
        $or: [{ senderDeviceId: deviceId }, { recipientDeviceId: deviceId }],
      })
      .sort({ createdAt: -1 })
      .limit(50);

    return {
      gifts: gifts.map((gift) => ({
        id: gift._id.toString(),
        direction: gift.senderDeviceId === deviceId ? 'sent' : 'received',
        otherParty:
          gift.senderDeviceId === deviceId
            ? gift.recipientDeviceId
            : gift.senderDeviceId,
        amount: gift.amount,
        status: gift.status,
        createdAt: gift.createdAt,
      })),
    };
  }
}
