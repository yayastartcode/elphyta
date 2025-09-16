const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dap')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define UserProgress schema (simplified)
const UserProgressSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  game_mode: { type: String, enum: ['truth', 'dare'], required: true },
  current_level: { type: Number, min: 1, max: 5, default: 1 },
  unlocked_levels: { type: [Number], default: [1] },
  completed_levels: { type: [Number], default: [] },
  total_score: { type: Number, default: 0 },
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
  last_updated: { type: Date, default: Date.now }
});

const UserProgress = mongoose.model('UserProgress', UserProgressSchema);

async function debugProgress() {
  try {
    console.log('\n=== Debugging UserProgress ===');
    
    // Find all user progress records
    const allProgress = await UserProgress.find({});
    console.log('\nTotal UserProgress records:', allProgress.length);
    
    allProgress.forEach((progress, index) => {
      console.log(`\n--- Record ${index + 1} ---`);
      console.log('User ID:', progress.user_id);
      console.log('Game Mode:', progress.game_mode);
      console.log('Current Level:', progress.current_level);
      console.log('Unlocked Levels:', progress.unlocked_levels);
      console.log('Completed Levels:', progress.completed_levels);
      console.log('Total Score:', progress.total_score);
      console.log('Level Completion:');
      Object.keys(progress.level_completion).forEach(level => {
        const completion = progress.level_completion[level];
        if (completion.completed) {
          console.log(`  ${level}: completed=${completion.completed}, score=${completion.score}, completed_at=${completion.completed_at}`);
        }
      });
      console.log('Last Updated:', progress.last_updated);
    });
    
  } catch (error) {
    console.error('Error debugging progress:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugProgress();