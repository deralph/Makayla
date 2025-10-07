import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LevelService } from './level.service';
import { LevelController } from './level.controller';
import { Level, LevelSchema } from './schema/level.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Level.name, schema: LevelSchema }]),
  ],
  controllers: [LevelController],
  providers: [LevelService],
  exports: [LevelService, MongooseModule], // Export if needed in other modules (like UserModule)
})
export class LevelModule {}
