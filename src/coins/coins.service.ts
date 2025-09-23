import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { UpdateCoinsDto } from './dto/update-coins.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class CoinsService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    private readonly userService: UserService,
  ) {}

  async updateCoins(deviceId: string, updateCoinsDto: UpdateCoinsDto) {
    const user = await this.userService.findByDeviceId(deviceId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update user's coin balance
    const newBalance = user.coins + updateCoinsDto.delta;
    await this.userService.updateUserState(deviceId, { coins: newBalance });

    // Create transaction record
    const transaction = new this.transactionModel({
      deviceId,
      delta: updateCoinsDto.delta,
      reason: updateCoinsDto.reason,
      opId: updateCoinsDto.opId,
      resultingBalance: newBalance,
      timestamp: new Date(),
    });

    await transaction.save();

    return {
      success: true,
      newBalance,
      transactionId: transaction._id,
      ledgerEntry: transaction,
    };
  }

  async getTransactions(deviceId: string, limit: number = 20, after?: string) {
    const query: any = { deviceId };

    if (after) {
      query._id = { $gt: after };
    }

    const transactions = await this.transactionModel
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();

    return {
      transactions: transactions.map((tx) => ({
        id: tx._id,
        delta: tx.delta,
        reason: tx.reason,
        timestamp: tx.timestamp,
        balanceAfter: tx.resultingBalance,
      })),
    };
  }
}
