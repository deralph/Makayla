import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from './schemas/user.schema';
import { UserRepository } from './repositories/user.repository';
import { S3Service } from './repositories/s3.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ConfigModule, // Make sure ConfigModule is imported for S3Service
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository, S3Service],
  exports: [UserService, UserRepository, MongooseModule],
})
export class UserModule {}