import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Item, ItemDocument } from './schemas/item.schema';
import { Booster, BoosterDocument } from './schemas/booster.schema';
import { PurchaseItemDto } from './dto/purchase-item.dto';
import { UserService } from '../user/user.service';
import { CoinsService } from '../coins/coins.service';

@Injectable()
export class ShopService {
  constructor(
    @InjectModel(Item.name) private itemModel: Model<ItemDocument>,
    @InjectModel(Booster.name) private boosterModel: Model<BoosterDocument>,
    private readonly userService: UserService,
    private readonly coinsService: CoinsService,
  ) {}

  async getItems() {
    const items = await this.itemModel.find({ active: true }).exec();
    const boosters = await this.boosterModel.find({ active: true }).exec();

    return {
      items: [...items, ...boosters].map((item) => ({
        id: item._id,
        name: item.name,
        description: item.description,
        cost: item.cost,
        type: item.type,
        meta: item.meta,
      })),
    };
  }

  async purchaseItem(deviceId: string, purchaseItemDto: PurchaseItemDto) {
    const user = await this.userService.findByDeviceId(deviceId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if item exists
    const item =
      (await this.itemModel.findById(purchaseItemDto.itemId).exec()) ||
      (await this.boosterModel.findById(purchaseItemDto.itemId).exec());

    if (!item || !item.active) {
      throw new BadRequestException('Item not available');
    }

    // Check if user has enough coins
    if (user.coins < item.cost) {
      throw new BadRequestException('Insufficient coins');
    }

    // Deduct coins
    await this.coinsService.updateCoins(deviceId, {
      delta: -item.cost,
      reason: `purchase_${item.type}`,
      opId: purchaseItemDto.opId,
    });

    const { updateDoc, coinBonus } = await this.getItemUpdate(user, item);

    let updatedUser = user;
    if (Object.keys(updateDoc).length > 0) {
      updatedUser = await this.userService.updateUserState(deviceId, updateDoc);
    } else {
      updatedUser = await this.userService.findByDeviceId(deviceId);
    }

    if (coinBonus) {
      await this.coinsService.updateCoins(deviceId, {
        delta: coinBonus,
        reason: `purchase_bonus_${item.type}`,
        opId: `${purchaseItemDto.opId}_bonus`,
      });
      updatedUser = await this.userService.findByDeviceId(deviceId);
    }

    return {
      success: true,
      newBalance: updatedUser.coins,
      itemState: updatedUser,
    };
  }

  private async getItemUpdate(user: any, item: any) {
    const updateDoc: any = {};
    const coinBonus = 0;

    switch (item.type) {
      case 'multitap':
        updateDoc.$inc = { multitapLevel: 1 };
        break;
      case 'energy':
        updateDoc.$inc = {
          energyLimit: item.meta?.energyIncrease || 0,
        };
        break;
      case 'booster':
        return this.applyBoosterPurchase(user, item);
      case 'card':
        // Placeholder for future card inventory support
        break;
      default:
        break;
    }

    return { updateDoc: this.cleanUpdateDoc(updateDoc), coinBonus };
  }

  private cleanUpdateDoc(updateDoc: Record<string, any>) {
    return Object.fromEntries(
      Object.entries(updateDoc).filter(([, value]) => {
        if (value == null) return false;
        if (typeof value === 'object') {
          return Object.keys(value).length > 0;
        }
        return true;
      }),
    );
  }

  private applyBoosterPurchase(user: any, item: any) {
    const updateDoc: any = { $inc: {}, $push: {}, $set: {} };
    const meta = item.meta || {};
    const boosterType = meta.boosterType || meta.type || item.name;
    const quantity = meta.quantity || 1;
    const duration = meta.durationMinutes;
    let coinBonus = 0;

    if (quantity > 0) {
      updateDoc.$inc[`boosterInventory.${boosterType}`] = quantity;
    }

    if (meta.instantCoins) {
      coinBonus += meta.instantCoins;
    }

    if (meta.restoreEnergy) {
      updateDoc.$set.energy = user.energyLimit;
    }

    if (meta.energyAmount) {
      const newEnergy = Math.min(
        user.energyLimit,
        (user.energy || 0) + meta.energyAmount,
      );
      updateDoc.$set.energy = newEnergy;
    }

    if (duration) {
      const expiresAt = new Date(Date.now() + duration * 60000);
      updateDoc.$push.activeBoosters = {
        boosterType,
        multiplier: meta.multiplier,
        expiresAt,
      };
    }

    return {
      updateDoc: this.cleanUpdateDoc(updateDoc),
      coinBonus,
    };
  }
}
