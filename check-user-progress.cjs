require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    return checkUserProgress();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define UserProgress schema
const userProgressSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  game_mode: { type: String, required: true },
  current_level: { type: Number, default: 1 },
  unlocked_levels: [{ type: Number }],
  completed_levels: [{ type: Number }],
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
  }
}, {
  timestamps: true
});

const UserProgress = mongoose.model('UserProgress', userProgressSchema);

async function checkUserProgress() {
  try {
    const testUserId = '68c6fc508f7d9cbeb7e60e7d';
    
    console.log('\n=== CHECKING USER PROGRESS AFTER SUBMIT ===');
    console.log('User ID:', testUserId);
    
    // Check user progress for truth mode
    const truthProgress = await UserProgress.findOne({
      user_id: testUserId,
      game_mode: 'truth'
    });
    
    if (truthProgress) {
      console.log('\n=== TRUTH MODE PROGRESS ===');
      console.log('Current Level:', truthProgress.current_level);
      console.log('Unlocked Levels:', truthProgress.unlocked_levels);
      console.log('Completed Levels:', truthProgress.completed_levels);
      console.log('Total Score:', truthProgress.total_score);
      
      console.log('\n=== LEVEL COMPLETION DETAILS ===');
      Object.keys(truthProgress.level_completion).forEach(levelKey => {
        const levelData = truthProgress.level_completion[levelKey];
        if (levelData && levelData.completed) {
          console.log(`${levelKey}:`);
          console.log(`  Completed: ${levelData.completed}`);
          console.log(`  Score: ${levelData.score}`);
          console.log(`  Completed At: ${levelData.completed_at}`);
        }
      });
    } else {
      console.log('No truth mode progress found for user');
    }
    
    // Check all progress records for this user
    const allProgress = await UserProgress.find({ user_id: testUserId });
    console.log('\n=== ALL PROGRESS RECORDS ===');
    console.log('Total progress records:', allProgress.length);
    allProgress.forEach((progress, index) => {
      console.log(`${index + 1}. Game Mode: ${progress.game_mode}`);
      console.log(`   Current Level: ${progress.current_level}`);
      console.log(`   Unlocked Levels: ${progress.unlocked_levels}`);
      console.log(`   Completed Levels: ${progress.completed_levels}`);
      console.log(`   Total Score: ${progress.total_score}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error checking user progress:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed.');
  }
}