import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PushTokenDocument = PushToken & Document;

@Schema({ timestamps: true })
export class PushToken {
  _id: Types.ObjectId;

  @Prop({ required: true, index: true })
  deviceId: string;

  @Prop({ required: true })
  token: string;

  @Prop({ default: 'unknown' })
  platform: string;

  @Prop({ default: Date.now })
  lastRegisteredAt: Date;
}

export const PushTokenSchema = SchemaFactory.createForClass(PushToken);

PushTokenSchema.index({ deviceId: 1, token: 1 }, { unique: true });
