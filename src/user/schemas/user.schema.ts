import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Level } from '../../level/schema/level.schema';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  deviceId: string;

  @Prop({ required: true })
  userFullname: string;

  @Prop({ required: true })
  deviceName: string;

  @Prop({ required: true, unique: true, index: true })
  imei: string;

  @Prop({ type: Object, required: true })
  deviceInfo: {
    model: string;
    osVersion: string;
    appVersion: string;
  };

  @Prop() // Optional profile picture field
  profilePicture?: string;

  @Prop({ default: 0, index: true })
  coins: number;

  @Prop({ default: 1000 })
  energy: number;

  @Prop({ default: 1000 })
  energyLimit: number;

  @Prop({ default: 0, index: true })
  profitPerHour: number;

  @Prop({ default: 1, index: true })
  level: number;

  @Prop({ default: 0 })
  multitapLevel: number;

  @Prop({ default: 'Bronze', index: true })
  rank: string;

  @Prop({ default: 0, index: true })
  rankPoints: number;

  @Prop({ type: Object, default: {} })
  missions: {
    daily: Array<{ day: number; claimed: boolean }>;
    social: {
      telegramJoined: boolean;
      xFollowed: boolean;
      postShared: boolean;
    };
  };

  @Prop({ type: [{ friendId: String, earned: Number }], default: [] })
  friends: Array<{ friendId: string; earned: number }>;

  @Prop({ index: true })
  refreshToken: string;

  @Prop({ index: true })
  lastSynced: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'Level', default: 1 }) // Default to level 1
  currentLevel: Level;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Compound indexes
UserSchema.index({ rankPoints: -1, coins: -1 });
UserSchema.index({ deviceId: 1, lastSynced: -1 });
UserSchema.index({ 'friends.friendId': 1 });
