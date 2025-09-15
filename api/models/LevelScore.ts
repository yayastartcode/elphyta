import mongoose, { Document, Schema } from 'mongoose';

export interface ILevelScore extends Document {
  user_id: mongoose.Types.ObjectId;
  game_mode: 'truth' | 'dare';
  level: number;
  total_score: number;
  questions_correct: number;
  total_time: number; // in seconds
  is_completed: boolean;
  completed_at?: Date;
  attempts: number;
}

const LevelScoreSchema: Schema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  game_mode: {
    type: String,
    enum: ['truth', 'dare'],
    required: true
  },
  level: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  total_score: {
    type: Number,
    default: 0,
    min: 0
  },
  questions_correct: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  total_time: {
    type: Number,
    default: 0,
    min: 0
  },
  is_completed: {
    type: Boolean,
    default: false
  },
  completed_at: {
    type: Date
  },
  attempts: {
    type: Number,
    default: 0,
    min: 0
  }
});

// Create indexes
LevelScoreSchema.index({ user_id: 1, game_mode: 1, level: 1 }, { unique: true });
LevelScoreSchema.index({ total_score: -1 });
LevelScoreSchema.index({ game_mode: 1, level: 1, total_score: -1 });

export default mongoose.model<ILevelScore>('LevelScore', LevelScoreSchema);