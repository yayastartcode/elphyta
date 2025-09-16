import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion extends Document {
  question_text: string;
  question_type: 'multiple_choice' | 'essay';
  options?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: 'A' | 'B' | 'C' | 'D' | string;
  level: number;
  game_mode: 'truth' | 'dare';
  question_order: number;
  explanation: string;
  points?: number;
  is_active?: boolean;
  created_at: Date;
}

const QuestionSchema: Schema = new Schema({
  question_text: {
    type: String,
    required: true
  },
  question_type: {
    type: String,
    enum: ['multiple_choice', 'essay'],
    default: 'multiple_choice',
    required: true
  },
  options: {
    A: { type: String, required: false },
    B: { type: String, required: false },
    C: { type: String, required: false },
    D: { type: String, required: false }
  },
  correct_answer: {
    type: String,
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
  is_active: {
    type: Boolean,
    default: true
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