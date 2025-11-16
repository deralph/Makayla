import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RedeemService } from './redeem.service';
import { RedeemController } from './redeem.controller';
import { AdminRedeemController } from './admin-redeem.controller';
import { RedeemCode, RedeemCodeSchema } from './schemas/redeem-code.schema';
import { UserModule } from '../user/user.module';
import { CoinsModule } from '../coins/coins.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RedeemCode.name, schema: RedeemCodeSchema },
    ]),
    UserModule,
    CoinsModule,
  ],
  controllers: [RedeemController, AdminRedeemController],
  providers: [RedeemService],
  exports: [RedeemService],
})
export class RedeemModule {}
