import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BoosterDocument = Booster & Document;

@Schema({ timestamps: true })
export class Booster {
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  cost: number;

  @Prop({ required: true })
  type: string; // full_energy, turbo, etc.

  @Prop({ type: Object, default: {} })
  meta: Record<string, any>;

  @Prop({ default: true })
  active: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const BoosterSchema = SchemaFactory.createForClass(Booster);
