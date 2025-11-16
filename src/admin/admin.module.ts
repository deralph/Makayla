import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Admin, AdminSchema } from './schemas/admin.schema';
import { Mission, MissionSchema } from '../missions/schemas/mission.schema';
import { Item, ItemSchema } from '../shop/schemas/item.schema';
import { Booster, BoosterSchema } from '../shop/schemas/booster.schema';
import { UserModule } from '../user/user.module';
import { CoinsModule } from '../coins/coins.module';
import { GameConfig, GameConfigSchema } from './schemas/game-config.schema';
import {
  AnalyticsSnapshot,
  AnalyticsSnapshotSchema,
} from './schemas/analytics-snapshot.schema';
import {
  Transaction,
  TransactionSchema,
} from '../coins/schemas/transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: Mission.name, schema: MissionSchema },
      { name: Item.name, schema: ItemSchema },
      { name: Booster.name, schema: BoosterSchema },
      { name: GameConfig.name, schema: GameConfigSchema },
      { name: AnalyticsSnapshot.name, schema: AnalyticsSnapshotSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    UserModule,
    CoinsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
