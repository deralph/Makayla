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

  @Prop({ type: String })
  assignedToDeviceId?: string;

  @Prop({
    type: {
      amount: { type: Number },
      reason: { type: String },
    },
  })
  gift?: {
    amount: number;
    reason: string;
  };

  @Prop({ default: false })
  requiresAdminConfirmation: boolean;

  @Prop({
    type: [
      {
        adminUsername: { type: String },
        deviceId: { type: String },
        confirmedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  confirmations: Array<{
    adminUsername: string;
    deviceId: string;
    confirmedAt: Date;
  }>;
}

export const RedeemCodeSchema = SchemaFactory.createForClass(RedeemCode);

RedeemCodeSchema.index({ code: 1 });
