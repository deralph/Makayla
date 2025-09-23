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

    // Apply item effect
    let itemState = {};
    switch (item.type) {
      case 'multitap':
        itemState = { multitapLevel: user.multitapLevel + 1 };
        break;
      case 'energy':
        itemState = {
          energyLimit: user.energyLimit + item.meta.energyIncrease,
        };
        break;
      case 'card':
        // Handle card purchase logic
        break;
      default:
        break;
    }

    // Update user state
    const updatedUser = await this.userService.updateUserState(
      deviceId,
      itemState,
    );

    return {
      success: true,
      newBalance: updatedUser.coins,
      itemState: updatedUser,
    };
  }
}
