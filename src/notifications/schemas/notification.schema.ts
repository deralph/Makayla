import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  _id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({ type: [String], default: [] })
  targetDeviceIds: string[];

  @Prop({ default: 'pending' })
  status: 'pending' | 'sent';

  @Prop({ type: [String], default: [] })
  deliveredTo: string[];
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ status: 1, createdAt: -1 });
