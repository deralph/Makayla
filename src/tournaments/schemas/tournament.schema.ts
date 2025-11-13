import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TournamentDocument = Tournament & Document;

@Schema({ timestamps: true })
export class Tournament {
  _id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;

  @Prop({ default: 0 })
  entryFee: number;

  @Prop({ type: Object, default: {} })
  rewards: {
    coins?: number;
    boosterType?: string;
    boosterAmount?: number;
  };

  @Prop({
    type: [
      {
        deviceId: { type: String, index: true },
        score: { type: Number, default: 0 },
        joinedAt: { type: Date, default: Date.now },
        lastSubmissionAt: { type: Date },
      },
    ],
    default: [],
  })
  leaderboard: Array<{
    deviceId: string;
    score: number;
    joinedAt: Date;
    lastSubmissionAt?: Date;
  }>;

  @Prop({ default: 'scheduled', index: true })
  status: 'scheduled' | 'running' | 'completed';
}

export const TournamentSchema = SchemaFactory.createForClass(Tournament);

TournamentSchema.index({ startDate: 1, endDate: 1 });
