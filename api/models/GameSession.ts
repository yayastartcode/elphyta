import mongoose, { Document, Schema } from 'mongoose';

export interface IGameSession extends Document {
  user_id: mongoose.Types.ObjectId;
  question_id: mongoose.Types.ObjectId;
  game_mode: 'truth' | 'dare';
  level: number;
  question_number: number;
  user_answer: 'A' | 'B' | 'C' | 'D' | 'TIMEOUT' | string;
  is_correct: boolean;
  time_spent: number; // in seconds
  score: number;
  played_at: Date;
}

const GameSessionSchema: Schema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question_id: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
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
  question_number: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  user_answer: {
    type: String,
    required: true
  },
  is_correct: {
    type: Boolean,
    required: true
  },
  time_spent: {
    type: Number,
    required: true,
    min: 0
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  played_at: {
    type: Date,
    default: Date.now
  }
});

// Create indexes
GameSessionSchema.index({ user_id: 1, level: 1, game_mode: 1 });
GameSessionSchema.index({ user_id: 1, played_at: -1 });
GameSessionSchema.index({ game_mode: 1, level: 1 });
GameSessionSchema.index({ score: -1 });

export default mongoose.model<IGameSession>('GameSession', GameSessionSchema);