import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion extends Document {
  question_text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: 'A' | 'B' | 'C' | 'D';
  level: number;
  game_mode: 'truth' | 'dare';
  question_order: number;
  explanation: string;
  points?: number;
  created_at: Date;
}

const QuestionSchema: Schema = new Schema({
  question_text: {
    type: String,
    required: true
  },
  options: {
    A: { type: String, required: true },
    B: { type: String, required: true },
    C: { type: String, required: true },
    D: { type: String, required: true }
  },
  correct_answer: {
    type: String,
    enum: ['A', 'B', 'C', 'D'],
    required: true
  },
  level: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  game_mode: {
    type: String,
    enum: ['truth', 'dare'],
    required: true
  },
  question_order: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  explanation: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    default: 10,
    min: 1
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Create indexes
QuestionSchema.index({ level: 1, game_mode: 1, question_order: 1 });
QuestionSchema.index({ game_mode: 1, level: 1 });
QuestionSchema.index({ created_at: -1 });

export default mongoose.model<IQuestion>('Question', QuestionSchema);