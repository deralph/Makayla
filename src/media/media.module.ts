import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { UserModule } from '../user/user.module';
import { CoinsModule } from '../coins/coins.module';

@Module({
  imports: [UserModule, CoinsModule],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
