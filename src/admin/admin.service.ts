import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { AdjustBalanceDto } from './dto/adjust-balance.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { CreateShopItemDto } from './dto/create-shop-item.dto';
import { UpdateShopItemDto } from './dto/update-shop-item.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { UserService } from '../user/user.service';
import { CoinsService } from '../coins/coins.service';
import { Admin, AdminDocument } from './schemas/admin.schema';
import { Mission, MissionDocument } from '../missions/schemas/mission.schema';
import { Item, ItemDocument } from '../shop/schemas/item.schema';
import { Booster, BoosterDocument } from '../shop/schemas/booster.schema';
import { GameConfig, GameConfigDocument } from './schemas/game-config.schema';
import {
  AnalyticsSnapshot,
  AnalyticsSnapshotDocument,
} from './schemas/analytics-snapshot.schema';
import {
  Transaction,
  TransactionDocument,
} from '../coins/schemas/transaction.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    @InjectModel(Mission.name) private missionModel: Model<MissionDocument>,
    @InjectModel(Item.name) private itemModel: Model<ItemDocument>,
    @InjectModel(Booster.name) private boosterModel: Model<BoosterDocument>,
    @InjectModel(GameConfig.name)
    private gameConfigModel: Model<GameConfigDocument>,
    @InjectModel(AnalyticsSnapshot.name)
    private analyticsSnapshotModel: Model<AnalyticsSnapshotDocument>,
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    private readonly userService: UserService,
    private readonly coinsService: CoinsService,
  ) {}

  async registerAdmin(createAdminDto: CreateAdminDto): Promise<AdminDocument> {
    // Check if admin already exists
    const existingAdmin = await this.adminModel
      .findOne({
        username: createAdminDto.username,
      })
      .exec();

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
    const fetchLimit = after ? limit * 2 : limit;
    const users = await this.userService.getAllUsers(fetchLimit);

    let sliceStart = 0;
    if (after) {
      const cursorIndex = users.findIndex(
        (candidate) => candidate.deviceId === after,
      );
      if (cursorIndex >= 0) {
        sliceStart = cursorIndex + 1;
      }
    }

    const page = users.slice(sliceStart, sliceStart + limit);

    return {
      users: page.map((user) => ({
        deviceId: user.deviceId,
        coinBalance: user.coins,
        createdAt: user.createdAt,
        lastSeen: user.lastSynced || user.createdAt,
        rank: user.rank,
      })),
      nextCursor:
        page.length === limit ? page[page.length - 1].deviceId : null,
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

    const bannedUntil = banUserDto.until
      ? new Date(banUserDto.until)
      : undefined;
    await this.userService.updateUserState(deviceId, {
      $set: {
        banned: true,
        bannedUntil: bannedUntil || null,
        banReason: banUserDto.reason,
      },
    });

    return {
      success: true,
      message: `User ${deviceId} has been banned${
        banUserDto.until ? ` until ${banUserDto.until}` : ' permanently'
      }`,
    };
  }

  // === MISSION MANAGEMENT ===
  async createMission(
    createMissionDto: CreateMissionDto,
  ): Promise<MissionDocument> {
    const mission = new this.missionModel({
      ...createMissionDto,
      createdAt: new Date(),
    });

    return mission.save();
  }

  async getMissions() {
    const missions = await this.missionModel
      .find()
      .sort({ order: 1, createdAt: -1 })
      .exec();
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
    const mission = await this.missionModel
      .findByIdAndUpdate(
        id,
        { ...updateMissionDto, updatedAt: new Date() },
        { new: true },
      )
      .exec();

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
    const mission = await this.missionModel
      .findByIdAndUpdate(
        id,
        { active: true, updatedAt: new Date() },
        { new: true },
      )
      .exec();

    if (!mission) {
      throw new NotFoundException('Mission not found');
    }

    return { mission };
  }

  async deactivateMission(id: string) {
    const mission = await this.missionModel
      .findByIdAndUpdate(
        id,
        { active: false, updatedAt: new Date() },
        { new: true },
      )
      .exec();

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

    const savedItem = await item.save();
    return savedItem;
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
    let item = await this.itemModel
      .findByIdAndUpdate(
        id,
        { ...updateShopItemDto, updatedAt: new Date() },
        { new: true },
      )
      .exec();

    if (!item) {
      item = await this.boosterModel
        .findByIdAndUpdate(
          id,
          { ...updateShopItemDto, updatedAt: new Date() },
          { new: true },
        )
        .exec();
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
    let item = await this.itemModel
      .findByIdAndUpdate(
        id,
        { active: true, updatedAt: new Date() },
        { new: true },
      )
      .exec();

    if (!item) {
      item = await this.boosterModel
        .findByIdAndUpdate(
          id,
          { active: true, updatedAt: new Date() },
          { new: true },
        )
        .exec();
    }

    if (!item) {
      throw new NotFoundException('Shop item not found');
    }

    return { item };
  }

  async deactivateShopItem(id: string) {
    let item = await this.itemModel
      .findByIdAndUpdate(
        id,
        { active: false, updatedAt: new Date() },
        { new: true },
      )
      .exec();

    if (!item) {
      item = await this.boosterModel
        .findByIdAndUpdate(
          id,
          { active: false, updatedAt: new Date() },
          { new: true },
        )
        .exec();
    }

    if (!item) {
      throw new NotFoundException('Shop item not found');
    }

    return { item };
  }

  // === GAME CONFIGURATION ===
  async getConfig() {
    let config = await this.gameConfigModel.findOne({ key: 'default' });

    if (!config) {
      config = await new this.gameConfigModel({
        key: 'default',
        gameSettings: {
          baseEnergy: 1000,
          energyRechargeRate: 1,
          baseProfitPerHour: 0,
          maxLevel: 100,
          rankTiers: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
        },
        economySettings: {
          tapReward: 1,
          offlineEarningsMultiplier: 1,
          inviteReward: 5000,
          videoAdReward: 1300,
        },
      }).save();
    }

    if (!config) {
      throw new NotFoundException('Game config not found');
    }

    return {
      gameSettings: config.gameSettings,
      economySettings: config.economySettings,
    };
  }

  async updateConfig(config: UpdateConfigDto) {
    const update: Record<string, any> = {};
    if (config.gameSettings) {
      update.gameSettings = config.gameSettings;
    }
    if (config.economySettings) {
      update.economySettings = config.economySettings;
    }

    const persistedConfig = await this.gameConfigModel
      .findOneAndUpdate(
        { key: 'default' },
        { $set: update },
        { new: true, upsert: true },
      )
      .lean();

    return {
      success: true,
      config: {
        gameSettings: persistedConfig?.gameSettings || {},
        economySettings: persistedConfig?.economySettings || {},
      },
    };
  }

  // === ANALYTICS ===
  async getAnalytics() {
    let snapshot = await this.analyticsSnapshotModel
      .findOne()
      .sort({ date: -1 })
      .lean();

    if (!snapshot) {
      snapshot = await this.generateSnapshotForDate(new Date());
    }

    return snapshot.metrics?.overview || {};
  }

  async getDailyStats(date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const dateKey = this.formatDate(targetDate);

    let snapshot = await this.analyticsSnapshotModel
      .findOne({ date: dateKey })
      .lean();

    if (!snapshot) {
      snapshot = await this.generateSnapshotForDate(targetDate);
    }

    return snapshot.metrics?.daily || { date: dateKey };
  }

  private async generateSnapshotForDate(date: Date) {
    const dateKey = this.formatDate(date);
    const metrics = await this.buildSnapshot(date);

    const snapshot = await this.analyticsSnapshotModel
      .findOneAndUpdate(
        { date: dateKey },
        { $set: { metrics } },
        { new: true, upsert: true },
      )
      .lean();

    return snapshot;
  }

  private async buildSnapshot(date: Date) {
    const [users, transactions] = await Promise.all([
      this.userService.getAllUsers(10000),
      this.getTransactionsForDate(date),
    ]);

    const now = Date.now();
    const activeUsers = users.filter((user) => {
      const lastSeen = user.lastSynced || user.createdAt;
      return now - lastSeen.getTime() <= 24 * 60 * 60 * 1000;
    });

    const totalCoins = users.reduce((sum, user) => sum + (user.coins || 0), 0);
    const averageLevel =
      users.length > 0
        ? users.reduce((sum, user) => sum + (user.level || 0), 0) / users.length
        : 0;

    const { coinsEarned, coinsSpent, missionsCompleted, itemsPurchased } =
      transactions.reduce(
        (acc, tx) => {
          if (tx.delta > 0) {
            acc.coinsEarned += tx.delta;
          } else {
            acc.coinsSpent += Math.abs(tx.delta);
          }

          if (tx.reason.startsWith('mission_')) {
            acc.missionsCompleted += 1;
          }
          if (tx.reason.startsWith('purchase_')) {
            acc.itemsPurchased += 1;
          }

          return acc;
        },
        {
          coinsEarned: 0,
          coinsSpent: 0,
          missionsCompleted: 0,
          itemsPurchased: 0,
        },
      );

    const dayWindow = this.getDayWindow(date);
    const newUsers = users.filter((user) => {
      return (
        user.createdAt >= dayWindow.start && user.createdAt < dayWindow.end
      );
    }).length;

    return {
      overview: {
        totalUsers: users.length,
        activeUsers: activeUsers.length,
        totalCoins,
        averageLevel,
      },
      daily: {
        date: this.formatDate(date),
        newUsers,
        activeUsers: activeUsers.length,
        coinsEarned,
        coinsSpent,
        missionsCompleted,
        itemsPurchased,
        totalTaps: 0,
      },
    };
  }

  private async getTransactionsForDate(date: Date) {
    const { start, end } = this.getDayWindow(date);
    return this.transactionModel
      .find({ timestamp: { $gte: start, $lt: end } })
      .lean();
  }

  private getDayWindow(date: Date) {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
  }

  private formatDate(date: Date) {
    return date.toISOString().split('T')[0];
  }
}
