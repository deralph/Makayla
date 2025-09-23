import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ItemDocument = Item & Document;

@Schema({ timestamps: true })
export class Item {
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  cost: number;

  @Prop({ required: true })
  type: string; // multitap, energy, card, etc.

  @Prop({ type: Object, default: {} })
  meta: Record<string, any>;

  @Prop({ default: true })
  active: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ItemSchema = SchemaFactory.createForClass(Item);
