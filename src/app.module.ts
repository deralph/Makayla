import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CoinsModule } from './coins/coins.module';
import { ShopModule } from './shop/shop.module';
import { MissionsModule } from './missions/missions.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { InvitesModule } from './invites/invites.module';
import { MediaModule } from './media/media.module';
import { AdminModule } from './admin/admin.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { GiftingModule } from './gifting/gifting.module';
import { RedeemModule } from './redeem/redeem.module';
import { NotificationsModule } from './notifications/notifications.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): ThrottlerModuleOptions => [
        {
          ttl: configService.get<number>('THROTTLE_TTL') || 60,
          limit: configService.get<number>('THROTTLE_LIMIT') || 10,
        },
      ],
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    CoinsModule,
    ShopModule,
    MissionsModule,
    LeaderboardModule,
    InvitesModule,
    MediaModule,
    AdminModule,
    TournamentsModule,
    GiftingModule,
    RedeemModule,
    NotificationsModule,
  ],
})
export class AppModule {}
