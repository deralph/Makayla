import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { RegisterDeviceDto } from '../auth/dto/register-device.dto';
import { UpdateUserStateDto } from './dto/update-user-state.dto';
import { SyncUserStateDto } from './dto/sync-user-state.dto';
import { S3Service } from './repositories/s3.service';
import { User } from './schemas/user.schema'; 


@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly s3Service: S3Service,
  ) {}

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
    
    console.log(syncUserStateDto);
    
    const now = new Date();
    const lastSync = user.lastSynced || user.createdAt;
    const hoursDiff = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
    const offlineEarnings = Math.floor(hoursDiff * user.profitPerHour);

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

  // New profile picture methods
  async uploadProfilePicture(deviceId: string, file: Express.Multer.File) {
    const user = await this.userRepository.findByDeviceId(deviceId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If user already has a profile picture, delete the old one from S3
    if (user.profilePicture) {
      await this.s3Service.deleteFile(user.profilePicture);
    }

    // Upload new file to S3
    const profilePictureUrl = await this.s3Service.uploadFile(file, deviceId);

    // Update user's profile picture URL in database
    const updatedUser = await this.userRepository.updateProfilePicture(deviceId, profilePictureUrl);

    return {
      message: 'Profile picture uploaded successfully',
      profilePicture: profilePictureUrl,
      user: updatedUser,
    };
  }

  async removeProfilePicture(deviceId: string) {
    const user = await this.userRepository.findByDeviceId(deviceId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.profilePicture) {
      throw new BadRequestException('User does not have a profile picture');
    }

    // Delete file from S3
    await this.s3Service.deleteFile(user.profilePicture);

    // Remove profile picture URL from user document
    const updatedUser = await this.userRepository.removeProfilePicture(deviceId);

    return {
      message: 'Profile picture removed successfully',
      user: updatedUser,
    };
  }

  async updateProfile(deviceId: string, updateData: Partial<User>) {
    const user = await this.userRepository.findByDeviceId(deviceId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent updating sensitive fields
    const { deviceId: _, _id: __, ...safeUpdateData } = updateData as any;
    
    const updatedUser = await this.userRepository.updateUserProfile(deviceId, safeUpdateData);

    return {
      message: 'Profile updated successfully',
      user: updatedUser,
    };
  }
}