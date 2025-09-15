import mongoose, { Document, Schema } from 'mongoose';

export interface IUserProgress extends Document {
  user_id: mongoose.Types.ObjectId;
  game_mode: 'truth' | 'dare';
  current_level: number;
  unlocked_levels: number[];
  level_completion: {
    level_1: { completed: boolean; score: number; completed_at?: Date };
    level_2: { completed: boolean; score: number; completed_at?: Date };
    level_3: { completed: boolean; score: number; completed_at?: Date };
    level_4: { completed: boolean; score: number; completed_at?: Date };
    level_5: { completed: boolean; score: number; completed_at?: Date };
  };
  last_updated: Date;
}

const UserProgressSchema: Schema = new Schema({
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
  current_level: {
    type: Number,
    min: 1,
    max: 5,
    default: 1
  },
  unlocked_levels: {
    type: [Number],
    default: [1]
  },
  level_completion: {
    level_1: {
      completed: { type: Boolean, default: false },
      score: { type: Number, default: 0 },
      completed_at: { type: Date }
    },
    level_2: {
      completed: { type: Boolean, default: false },
      score: { type: Number, default: 0 },
      completed_at: { type: Date }
    },
    level_3: {
      completed: { type: Boolean, default: false },
      score: { type: Number, default: 0 },
      completed_at: { type: Date }
    },
    level_4: {
      completed: { type: Boolean, default: false },
      score: { type: Number, default: 0 },
      completed_at: { type: Date }
    },
    level_5: {
      completed: { type: Boolean, default: false },
      score: { type: Number, default: 0 },
      completed_at: { type: Date }
    }
  },
  last_updated: {
    type: Date,
    default: Date.now
  }
});

// Update the last_updated field before saving
UserProgressSchema.pre('save', function(next) {
  this.last_updated = new Date();
  next();
});

// Create indexes
UserProgressSchema.index({ user_id: 1, game_mode: 1 }, { unique: true });
UserProgressSchema.index({ user_id: 1 });

export default mongoose.model<IUserProgress>('UserProgress', UserProgressSchema);