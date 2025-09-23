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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: Mission.name, schema: MissionSchema },
      { name: Item.name, schema: ItemSchema },
      { name: Booster.name, schema: BoosterSchema },
    ]),
    UserModule,
    CoinsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}