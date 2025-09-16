const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dap')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define UserProgress schema
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

async function testSubmit() {
  try {
    console.log('\n=== Testing Submit Logic ===');
    
    // Get a user who has completed a level
    const userProgress = await UserProgress.findOne({ game_mode: 'truth' });
    
    if (!userProgress) {
      console.log('No UserProgress found');
      return;
    }
    
    console.log('\nFound UserProgress:');
    console.log('User ID:', userProgress.user_id);
    console.log('Game Mode:', userProgress.game_mode);
    console.log('Before - Completed Levels:', userProgress.completed_levels);
    console.log('Before - Unlocked Levels:', userProgress.unlocked_levels);
    
    // Simulate level 1 completion
    const level = 1;
    const totalScore = 50;
    const correctAnswers = 5;
    const totalQuestions = 5;
    
    // Update level completion
    const levelKey = `level_${level}`;
    userProgress.level_completion[levelKey] = {
      completed: true,
      score: totalScore,
      completed_at: new Date()
    };
    
    // Add to completed_levels array if not already there
    const currentLevel = parseInt(level);
    if (!userProgress.completed_levels.includes(currentLevel)) {
      userProgress.completed_levels.push(currentLevel);
      console.log('Added level to completed_levels:', currentLevel);
    }
    
    // Unlock next level if score is good enough
    const scorePercentage = (correctAnswers / totalQuestions) * 100;
    console.log('Score percentage:', scorePercentage);
    
    if (scorePercentage >= 60 && currentLevel < 5) {
      const nextLevel = currentLevel + 1;
      if (!userProgress.unlocked_levels.includes(nextLevel)) {
        userProgress.unlocked_levels.push(nextLevel);
        console.log('Unlocked next level:', nextLevel);
      }
      if (nextLevel > userProgress.current_level) {
        userProgress.current_level = nextLevel;
      }
    }
    
    console.log('\nAfter update - Completed Levels:', userProgress.completed_levels);
    console.log('After update - Unlocked Levels:', userProgress.unlocked_levels);
    
    // Save the progress
    await userProgress.save();
    console.log('UserProgress saved successfully');
    
    // Verify the save
    const updatedProgress = await UserProgress.findById(userProgress._id);
    console.log('\nVerification - Completed Levels:', updatedProgress.completed_levels);
    console.log('Verification - Unlocked Levels:', updatedProgress.unlocked_levels);
    
  } catch (error) {
    console.error('Error testing submit:', error);
  } finally {
    mongoose.connection.close();
  }
}

testSubmit();