import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  deviceId: string;

  @Prop({ required: true }) // Added to schema
  userFullname: string;

  @Prop({ required: true }) // Added to schema
  deviceName: string;

  @Prop({ required: true, unique: true, index: true }) // Added to schema
  imei: string;

  // Add deviceInfo to the schema
  @Prop({ type: Object, required: true }) // Stores the entire deviceInfo object
  deviceInfo: {
    model: string;
    osVersion: string;
    appVersion: string;
  };

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
}

export const UserSchema = SchemaFactory.createForClass(User);

// Compound indexes for better query performance
UserSchema.index({ rankPoints: -1, coins: -1 });
UserSchema.index({ deviceId: 1, lastSynced: -1 });
UserSchema.index({ 'friends.friendId': 1 });
