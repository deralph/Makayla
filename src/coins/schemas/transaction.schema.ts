import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  _id: Types.ObjectId;

  @Prop({ required: true, index: true })
  deviceId: string;

  @Prop({ required: true })
  delta: number;

  @Prop({ required: true })
  reason: string;

  @Prop({ required: true,unique: true })
  opId: string;

  @Prop({ required: true })
  resultingBalance: number;

  @Prop({ default: Date.now })
  timestamp: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Index for transaction queries
TransactionSchema.index({ deviceId: 1, timestamp: -1 });
