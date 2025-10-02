import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { RegisterDeviceDto } from '../../auth/dto/register-device.dto';
import { SyncUserStateDto } from '../dto/sync-user-state.dto';
import { UpdateUserStateDto } from '../dto/update-user-state.dto';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByDeviceId(deviceId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ deviceId }).exec();
  }

  async findById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId).exec();
  }

  async create(registerDeviceDto: RegisterDeviceDto): Promise<UserDocument> {
    const createdUser = new this.userModel({
      ...registerDeviceDto,
      coins: 0,
      energy: 1000,
      energyLimit: 1000,
      profitPerHour: 0,
      level: 1,
      multitapLevel: 0,
      rank: 'Bronze',
      rankPoints: 0,
      missions: {
        daily: [],
        social: {
          telegramJoined: false,
          xFollowed: false,
          postShared: false,
        },
      },
      friends: [],
      createdAt: new Date(),
    });
    
    return createdUser.save();
  }

  async updateRefreshToken(deviceId: string, refreshToken: string): Promise<UserDocument> {
    const user = await this.userModel
      .findOneAndUpdate({ deviceId }, { refreshToken }, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfilePicture(deviceId: string, profilePictureUrl: string): Promise<UserDocument> {
    const user = await this.userModel
      .findOneAndUpdate(
        { deviceId },
        { profilePicture: profilePictureUrl },
        { new: true }
      )
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async removeProfilePicture(deviceId: string): Promise<UserDocument> {
    const user = await this.userModel
      .findOneAndUpdate(
        { deviceId },
        { $unset: { profilePicture: 1 } },
        { new: true }
      )
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserProfile(deviceId: string, updateData: Partial<User>): Promise<UserDocument> {
    const user = await this.userModel
      .findOneAndUpdate(
        { deviceId },
        { $set: updateData },
        { new: true }
      )
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ... keep all your existing methods (updateState, updateUserState, addFriend, etc.)
  async updateState(
    deviceId: string,
    syncUserStateDto: SyncUserStateDto,
    offlineEarnings: number,
  ): Promise<UserDocument> {
    const updateData: any = {
      lastSynced: new Date(),
    };

    // Apply operations from the sync request
    if (syncUserStateDto.ops && syncUserStateDto.ops.length > 0) {
      for (const op of syncUserStateDto.ops) {
        switch (op.type) {
          case 'tap':
            updateData.$inc = updateData.$inc || {};
            updateData.$inc.coins = (updateData.$inc.coins || 0) + (op.amount || 0);
            updateData.$inc.energy = (updateData.$inc.energy || 0) - (op.amount || 0);
            break;
          case 'purchase':
            updateData.$inc = updateData.$inc || {};
            updateData.$inc.coins = (updateData.$inc.coins || 0) - (op.cost || 0);
            if (op.item === 'multitap') {
              updateData.$inc = updateData.$inc || {};
              updateData.$inc.multitapLevel = 1;
            }
            break;
        }
      }
    }

    // Add offline earnings
    if (offlineEarnings > 0) {
      updateData.$inc = updateData.$inc || {};
      updateData.$inc.coins = (updateData.$inc.coins || 0) + offlineEarnings;
    }

    const user = await this.userModel
      .findOneAndUpdate({ deviceId }, updateData, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserState(deviceId: string, updateData: UpdateUserStateDto): Promise<UserDocument> {
    const user = await this.userModel
      .findOneAndUpdate({ deviceId }, updateData, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async addFriend(deviceId: string, friendDeviceId: string, earned: number): Promise<UserDocument> {
    const user = await this.userModel
      .findOneAndUpdate(
        { deviceId },
        {
          $push: {
            friends: {
              friendId: friendDeviceId,
              earned,
            },
          },
        },
        { new: true },
      )
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getTopUsers(limit: number): Promise<UserDocument[]> {
    return this.userModel.find().sort({ coins: -1 }).limit(limit).exec();
  }

  async getAllUsers(limit: number): Promise<UserDocument[]> {
    return this.userModel.find().sort({ createdAt: -1 }).limit(limit).exec();
  }

  async getUsersByIds(deviceIds: string[]): Promise<UserDocument[]> {
    return this.userModel.find({ deviceId: { $in: deviceIds } }).exec();
  }
}