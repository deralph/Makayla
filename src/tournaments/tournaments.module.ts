import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TournamentsService } from './tournaments.service';
import { TournamentsController } from './tournaments.controller';
import { AdminTournamentsController } from './admin-tournaments.controller';
import { Tournament, TournamentSchema } from './schemas/tournament.schema';
import { UserModule } from '../user/user.module';
import { CoinsModule } from '../coins/coins.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tournament.name, schema: TournamentSchema },
    ]),
    UserModule,
    CoinsModule,
  ],
  controllers: [TournamentsController, AdminTournamentsController],
  providers: [TournamentsService],
  exports: [TournamentsService],
})
export class TournamentsModule {}
