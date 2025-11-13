import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RedeemCodeDocument = RedeemCode & Document;

@Schema({ timestamps: true })
export class RedeemCode {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ type: [Object], default: [] })
  rewards: Array<Record<string, any>>;

  @Prop({ default: 1 })
  maxUses: number;

  @Prop({ type: Date })
  expiresAt?: Date;

  @Prop({ type: [String], default: [] })
  usedBy: string[];
}

export const RedeemCodeSchema = SchemaFactory.createForClass(RedeemCode);

RedeemCodeSchema.index({ code: 1 });
