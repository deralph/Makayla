import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InviteDocument = Invite & Document;

@Schema({ timestamps: true })
export class Invite {
  _id: Types.ObjectId;

  @Prop({ required: true, index: true })
  inviterDeviceId: string;

  @Prop({ index: true })
  inviteeDeviceId: string;

  @Prop({ required: true, unique: true, index: true })
  inviteCode: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  rewarded: boolean;

  @Prop()
  claimedAt: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const InviteSchema = SchemaFactory.createForClass(Invite);

// Index for invite queries
InviteSchema.index({ inviterDeviceId: 1, createdAt: -1 });
InviteSchema.index({ inviteCode: 1, expiresAt: 1, rewarded: 1 });
