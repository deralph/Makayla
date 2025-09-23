import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MissionDocument = Mission & Document;

@Schema({ timestamps: true })
export class Mission {
  _id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  reward: number;

  @Prop({ type: Object, default: {} })
  conditions: Record<string, any>;

  @Prop({ type: Object, default: {} })
  meta: Record<string, any>;

  @Prop({ default: true })
  active: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const MissionSchema = SchemaFactory.createForClass(Mission);
