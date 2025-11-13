import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AnalyticsSnapshotDocument = AnalyticsSnapshot & Document;

@Schema({ timestamps: true })
export class AnalyticsSnapshot {
  @Prop({ required: true, unique: true })
  date: string; // YYYY-MM-DD

  @Prop({ type: Object, default: {} })
  metrics: Record<string, any>;
}

export const AnalyticsSnapshotSchema =
  SchemaFactory.createForClass(AnalyticsSnapshot);

AnalyticsSnapshotSchema.index({ date: 1 });
