import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GameConfigDocument = GameConfig & Document;

@Schema({ timestamps: true })
export class GameConfig {
  @Prop({ required: true, unique: true, default: 'default' })
  key: string;

  @Prop({ type: Object, default: {} })
  gameSettings: Record<string, any>;

  @Prop({ type: Object, default: {} })
  economySettings: Record<string, any>;
}

export const GameConfigSchema = SchemaFactory.createForClass(GameConfig);
