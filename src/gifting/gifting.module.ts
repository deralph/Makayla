import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GiftingService } from './gifting.service';
import { GiftingController } from './gifting.controller';
import { Gift, GiftSchema } from './schemas/gift.schema';
import { UserModule } from '../user/user.module';
import { CoinsModule } from '../coins/coins.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Gift.name, schema: GiftSchema }]),
    UserModule,
    CoinsModule,
  ],
  controllers: [GiftingController],
  providers: [GiftingService],
  exports: [GiftingService],
})
export class GiftingModule {}
