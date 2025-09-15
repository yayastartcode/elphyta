const mongoose = require('mongoose');
require('dotenv').config();

// UserProgress schema (simplified for CommonJS)
const UserProgressSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  game_mode: { type: String, enum: ['truth', 'dare'], required: true },
  current_level: { type: Number, min: 1, max: 5, default: 1 },
  unlocked_levels: { type: [Number], default: [1] },
  completed_levels: { type: [Number], default: [] },
  total_score: { type: Number, default: 0 },
  last_updated: { type: Date, default: Date.now }
});

const UserProgress = mongoose.model('UserProgress', UserProgressSchema);

async function checkProgress() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');
    
    const progress = await UserProgress.find({});
    console.log('UserProgress records found:', progress.length);
    
    progress.forEach(p => {
      console.log('User ID:', p.user_id, 'Game Mode:', p.game_mode, 'Unlocked Levels:', p.unlocked_levels);
    });
    
    // Check for specific user
    const userProgress = await UserProgress.find({ user_id: '68c6fc508f7d9cbeb7e60e7d' });
    console.log('\nProgress for test user:', userProgress.length, 'records');
    userProgress.forEach(p => {
      console.log('Game Mode:', p.game_mode, 'Unlocked Levels:', p.unlocked_levels);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkProgress();