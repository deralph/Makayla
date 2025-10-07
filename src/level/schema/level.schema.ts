import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LevelDocument = Level & Document;

@Schema({ timestamps: true })
export class Level {
  @Prop({ required: true, unique: true })
  levelNumber: number;

  @Prop({ required: true })
  levelName: string;

  @Prop({ required: true })
  price: number; // Cost to upgrade to this level

  @Prop({ type: [String], default: [] }) // Array of perk descriptions
  perks: string[];

  @Prop()
  requiredRank: string; // e.g., 'Bronze', 'Silver'

  @Prop({ default: 0 })
  requiredRankPoints: number;
}

export const LevelSchema = SchemaFactory.createForClass(Level);
