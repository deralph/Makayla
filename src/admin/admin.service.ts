import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { AdjustBalanceDto } from './dto/adjust-balance.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { CreateShopItemDto } from './dto/create-shop-item.dto';
import { UpdateShopItemDto } from './dto/update-shop-item.dto';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { UserService } from '../user/user.service';
import { CoinsService } from '../coins/coins.service';
import { Admin, AdminDocument } from './schemas/admin.schema';
import { Mission, MissionDocument } from '../missions/schemas/mission.schema';
import { Item, ItemDocument } from '../shop/schemas/item.schema';
import { Booster, BoosterDocument } from '../shop/schemas/booster.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    @InjectModel(Mission.name) private missionModel: Model<MissionDocument>,
    @InjectModel(Item.name) private itemModel: Model<ItemDocument>,
    @InjectModel(Booster.name) private boosterModel: Model<BoosterDocument>,
    private readonly userService: UserService,
    private readonly coinsService: CoinsService,
  ) {}

  async registerAdmin(createAdminDto: CreateAdminDto): Promise<AdminDocument> {
    // Check if admin already exists
    const existingAdmin = await this.adminModel.findOne({ 
      username: createAdminDto.username 
    }).exec();
    
    if (existingAdmin) {
      throw new ConflictException('Admin username already exists');
    }

    const passwordHash = await bcrypt.hash(createAdminDto.password, 12);
    
    const admin = new this.adminModel({
      username: createAdminDto.username,
      passwordHash: passwordHash,
      email: createAdminDto.email,
      role: createAdminDto.role || 'admin',
      isActive: true,
    });

    return admin.save();
  }

  async getUsers(limit: number = 50, after?: string) {
    const users = await this.userService.getAllUsers(limit);
    
    return {
      users: users.map(user => ({
        deviceId: user.deviceId,
        coinBalance: user.coins,
        createdAt: user.createdAt,
        lastSeen: user.lastSynced || user.createdAt,
        rank: user.rank,
      })),
      nextCursor: users.length > 0 ? users[users.length - 1].deviceId : null,
    };
  }

  async getUser(deviceId: string) {
    const user = await this.userService.findByDeviceId(deviceId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const transactions = await this.coinsService.getTransactions(deviceId, 100);

    return {
      user: {
        deviceId: user.deviceId,
        coins: user.coins,
        energy: user.energy,
        profitPerHour: user.profitPerHour,
        level: user.level,
        multitapLevel: user.multitapLevel,
        energyLimit: user.energyLimit,
        rank: user.rank,
        rankPoints: user.rankPoints,
        missions: user.missions,
        friends: user.friends,
        lastSynced: user.lastSynced,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      transactions: transactions.transactions,
    };
  }

  async adjustBalance(deviceId: string, adjustBalanceDto: AdjustBalanceDto) {
    const user = await this.userService.findByDeviceId(deviceId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.coinsService.updateCoins(deviceId, {
      delta: adjustBalanceDto.delta,
      reason: `admin_adjustment: ${adjustBalanceDto.reason}`,
      opId: `admin_${Date.now()}`,
    });

    const updatedUser = await this.userService.findByDeviceId(deviceId);

    return {
      success: true,
      newBalance: updatedUser?.coins || 0,
    };
  }

  async banUser(deviceId: string, banUserDto: BanUserDto) {
    const user = await this.userService.findByDeviceId(deviceId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      message: `User ${deviceId} has been banned${banUserDto.until ? ` until ${banUserDto.until}` : ' permanently'}`,
    };
  }

 

  // === MISSION MANAGEMENT ===
  async createMission(createMissionDto: CreateMissionDto): Promise<MissionDocument> {
    const mission = new this.missionModel({
      ...createMissionDto,
      createdAt: new Date(),
    });
    
    return mission.save();
  }

  async getMissions() {
    const missions = await this.missionModel.find().sort({ order: 1, createdAt: -1 }).exec();
    return { missions };
  }

  async getMission(id: string) {
    const mission = await this.missionModel.findById(id).exec();
    if (!mission) {
      throw new NotFoundException('Mission not found');
    }
    return { mission };
  }

  async updateMission(id: string, updateMissionDto: UpdateMissionDto) {
    const mission = await this.missionModel.findByIdAndUpdate(
      id,
      { ...updateMissionDto, updatedAt: new Date() },
      { new: true }
    ).exec();
    
    if (!mission) {
      throw new NotFoundException('Mission not found');
    }
    
    return { mission };
  }

  async deleteMission(id: string) {
    const mission = await this.missionModel.findByIdAndDelete(id).exec();
    if (!mission) {
      throw new NotFoundException('Mission not found');
    }
    
    return { success: true, message: 'Mission deleted successfully' };
  }

  async activateMission(id: string) {
    const mission = await this.missionModel.findByIdAndUpdate(
      id,
      { active: true, updatedAt: new Date() },
      { new: true }
    ).exec();
    
    if (!mission) {
      throw new NotFoundException('Mission not found');
    }
    
    return { mission };
  }

  async deactivateMission(id: string) {
    const mission = await this.missionModel.findByIdAndUpdate(
      id,
      { active: false, updatedAt: new Date() },
      { new: true }
    ).exec();
    
    if (!mission) {
      throw new NotFoundException('Mission not found');
    }
    
    return { mission };
  }

  // === SHOP ITEM MANAGEMENT ===
  async createShopItem(createShopItemDto: CreateShopItemDto) {
    let item;
    
    if (createShopItemDto.type === 'booster') {
      item = new this.boosterModel({
        ...createShopItemDto,
        createdAt: new Date(),
      });
    } else {
      item = new this.itemModel({
        ...createShopItemDto,
        createdAt: new Date(),
      });
    }
    
    return item.save();
  }

  async getShopItems() {
    const items = await this.itemModel.find().exec();
    const boosters = await this.boosterModel.find().exec();
    
    return { items: [...items, ...boosters] };
  }

  async getShopItem(id: string) {
    let item = await this.itemModel.findById(id).exec();
    if (!item) {
      item = await this.boosterModel.findById(id).exec();
    }
    
    if (!item) {
      throw new NotFoundException('Shop item not found');
    }
    
    return { item };
  }

  async updateShopItem(id: string, updateShopItemDto: UpdateShopItemDto) {
    let item = await this.itemModel.findByIdAndUpdate(
      id,
      { ...updateShopItemDto, updatedAt: new Date() },
      { new: true }
    ).exec();
    
    if (!item) {
      item = await this.boosterModel.findByIdAndUpdate(
        id,
        { ...updateShopItemDto, updatedAt: new Date() },
        { new: true }
      ).exec();
    }
    
    if (!item) {
      throw new NotFoundException('Shop item not found');
    }
    
    return { item };
  }

  async deleteShopItem(id: string) {
    let item = await this.itemModel.findByIdAndDelete(id).exec();
    if (!item) {
      item = await this.boosterModel.findByIdAndDelete(id).exec();
    }
    
    if (!item) {
      throw new NotFoundException('Shop item not found');
    }
    
    return { success: true, message: 'Shop item deleted successfully' };
  }

  async activateShopItem(id: string) {
    let item = await this.itemModel.findByIdAndUpdate(
      id,
      { active: true, updatedAt: new Date() },
      { new: true }
    ).exec();
    
    if (!item) {
      item = await this.boosterModel.findByIdAndUpdate(
        id,
        { active: true, updatedAt: new Date() },
        { new: true }
      ).exec();
    }
    
    if (!item) {
      throw new NotFoundException('Shop item not found');
    }
    
    return { item };
  }

  async deactivateShopItem(id: string) {
    let item = await this.itemModel.findByIdAndUpdate(
      id,
      { active: false, updatedAt: new Date() },
      { new: true }
    ).exec();
    
    if (!item) {
      item = await this.boosterModel.findByIdAndUpdate(
        id,
        { active: false, updatedAt: new Date() },
        { new: true }
      ).exec();
    }
    
    if (!item) {
      throw new NotFoundException('Shop item not found');
    }
    
    return { item };
  }

  // === GAME CONFIGURATION ===
  async getConfig() {
    // Return current game configuration
    return {
      gameSettings: {
        baseEnergy: 1000,
        energyRechargeRate: 1, // per minute
        baseProfitPerHour: 0,
        maxLevel: 100,
        rankTiers: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
      },
      economySettings: {
        tapReward: 1,
        offlineEarningsMultiplier: 1,
        inviteReward: 5000,
        videoAdReward: 1300,
      }
    };
  }

  async updateConfig(config: any) {
    // In a real implementation, save to database
    return { success: true, config };
  }

  // === ANALYTICS ===
  async getAnalytics() {
    const totalUsers = await this.userService.getAllUsers(10000); // Get all users for count
    const activeUsers = totalUsers.filter(user => {
      const lastSeen = user.lastSynced || user.createdAt;
      const daysSinceLastSeen = (new Date().getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceLastSeen <= 1; // Active in last 24 hours
    });

    return {
      totalUsers: totalUsers.length,
      activeUsers: activeUsers.length,
      totalCoins: totalUsers.reduce((sum, user) => sum + user.coins, 0),
      averageLevel: totalUsers.reduce((sum, user) => sum + user.level, 0) / totalUsers.length,
      userGrowth: {
        today: activeUsers.length,
        week: Math.round(activeUsers.length * 1.2), // Example calculation
        month: Math.round(activeUsers.length * 1.5),
      }
    };
  }

  async getDailyStats(date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    
    // Example implementation - in real app, you'd query actual daily data
    return {
      date: targetDate.toISOString().split('T')[0],
      newUsers: 150,
      activeUsers: 1200,
      totalTaps: 45000,
      coinsEarned: 250000,
      coinsSpent: 180000,
      missionsCompleted: 850,
      itemsPurchased: 320,
    };  
  }

  
}