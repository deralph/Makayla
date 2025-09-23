import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { RegisterDeviceDto } from '../auth/dto/register-device.dto';
import { UpdateUserStateDto } from './dto/update-user-state.dto';
import { SyncUserStateDto } from './dto/sync-user-state.dto';
// import { Logger } from '@nestjs/common';

@Injectable()
export class UserService {

  constructor(private readonly userRepository: UserRepository){}

  async findByDeviceId(deviceId: string) {
    return this.userRepository.findByDeviceId(deviceId);
  }

  async create(registerDeviceDto: RegisterDeviceDto) {
    return this.userRepository.create(registerDeviceDto);
  }

  async updateRefreshToken(deviceId: string, refreshToken: string) {
    return this.userRepository.updateRefreshToken(deviceId, refreshToken);
  }

  async getFullState(deviceId: string) {
    const user = await this.userRepository.findByDeviceId(deviceId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async syncState(deviceId: string, syncUserStateDto: SyncUserStateDto) {
    const user = await this.userRepository.findByDeviceId(deviceId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // this.logger.debug('Received DTO:', syncUserStateDto);
    console.log(syncUserStateDto)
    // Calculate offline earnings
    const now = new Date();
    const lastSync = user.lastSynced || user.createdAt;
    const hoursDiff = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
    const offlineEarnings = Math.floor(hoursDiff * user.profitPerHour);

    // Update user state
    const updatedUser = await this.userRepository.updateState(
      deviceId,
      syncUserStateDto,
      offlineEarnings,
    );

    return {
      offlineEarnings,
      newState: updatedUser,
    };
  }

  async getMinimalState(deviceId: string) {
    const user = await this.userRepository.findByDeviceId(deviceId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      coinBalance: user.coins,
      energy: user.energy,
      profitPerHour: user.profitPerHour,
      rank: user.rank,
    };
  }

  async updateUserState(deviceId: string, updateData: UpdateUserStateDto) {
    return this.userRepository.updateUserState(deviceId, updateData);
  }

  async addFriend(deviceId: string, friendDeviceId: string, earned: number) {
    return this.userRepository.addFriend(deviceId, friendDeviceId, earned);
  }

  async getTopUsers(limit: number) {
    return this.userRepository.getTopUsers(limit);
  }

  async getAllUsers(limit: number) {
    return this.userRepository.getAllUsers(limit);
  }

  async getUsersByIds(deviceIds: string[]) {
    return this.userRepository.getUsersByIds(deviceIds);
  }
}
