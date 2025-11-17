import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GiftDocument = Gift & Document;

@Schema({ timestamps: true })
export class Gift {
  _id: Types.ObjectId;

  @Prop({ required: true })
  senderDeviceId: string;

  @Prop({ required: true })
  recipientDeviceId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  reason: string;

  @Prop({ default: 'completed' })
  status: 'completed' | 'failed';

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const GiftSchema = SchemaFactory.createForClass(Gift);

GiftSchema.index({ senderDeviceId: 1, createdAt: -1 });
GiftSchema.index({ recipientDeviceId: 1, createdAt: -1 });
