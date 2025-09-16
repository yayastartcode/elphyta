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

// LevelScore schema
const LevelScoreSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  game_mode: { type: String, enum: ['truth', 'dare'], required: true },
  level: { type: Number, min: 1, max: 5, required: true },
  total_score: { type: Number, default: 0 },
  questions_correct: { type: Number, default: 0 },
  total_time: { type: Number, default: 0 },
  is_completed: { type: Boolean, default: false },
  attempts: { type: Number, default: 1 },
  completed_at: { type: Date, default: Date.now }
});

const LevelScore = mongoose.model('LevelScore', LevelScoreSchema);

async function unlockAllLevelsForUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    console.log('\n=== UNLOCK ALL LEVELS FOR USER ===');
    
    const userId = new mongoose.Types.ObjectId('68c6fc508f7d9cbeb7e60e7d');
    const gameMode = 'truth';
    
    // Find the user's progress
    let userProgress = await UserProgress.findOne({
      user_id: userId,
      game_mode: gameMode
    });
    
    if (!userProgress) {
      console.log('Creating new UserProgress...');
      userProgress = new UserProgress({
        user_id: userId,
        game_mode: gameMode,
        current_level: 1,
        unlocked_levels: [1],
        completed_levels: [],
        total_score: 0
      });
      await userProgress.save();
    }
    
    console.log('\nBefore unlocking all levels:');
    console.log('Current Level:', userProgress.current_level);
    console.log('Unlocked Levels:', userProgress.unlocked_levels);
    console.log('Completed Levels:', userProgress.completed_levels);
    
    // Unlock all levels (1-5)
    userProgress.unlocked_levels = [1, 2, 3, 4, 5];
    userProgress.current_level = 5;
    
    // Mark all levels as completed with perfect scores
    const perfectScore = 100;
    const perfectCorrectAnswers = 5;
    
    for (let level = 1; level <= 5; level++) {
      const levelKey = `level_${level}`;
      userProgress.level_completion[levelKey] = {
        completed: true,
        score: perfectScore,
        completed_at: new Date()
      };
      
      // Add to completed_levels if not already there
      if (!userProgress.completed_levels.includes(level)) {
        userProgress.completed_levels.push(level);
      }
      
      // Create or update LevelScore record
      const existingLevelScore = await LevelScore.findOne({
        user_id: userId,
        game_mode: gameMode,
        level: level
      });
      
      if (existingLevelScore) {
        existingLevelScore.total_score = perfectScore;
        existingLevelScore.questions_correct = perfectCorrectAnswers;
        existingLevelScore.is_completed = true;
        existingLevelScore.completed_at = new Date();
        await existingLevelScore.save();
        console.log(`Updated LevelScore for level ${level}`);
      } else {
        const newLevelScore = new LevelScore({
          user_id: userId,
          game_mode: gameMode,
          level: level,
          total_score: perfectScore,
          questions_correct: perfectCorrectAnswers,
          total_time: 60,
          is_completed: true,
          attempts: 1
        });
        await newLevelScore.save();
        console.log(`Created LevelScore for level ${level}`);
      }
    }
    
    // Save the UserProgress changes
    await userProgress.save();
    console.log('\nUserProgress updated successfully');
    
    // Verify the changes
    const updatedProgress = await UserProgress.findById(userProgress._id);
    console.log('\nAfter unlocking all levels:');
    console.log('Current Level:', updatedProgress.current_level);
    console.log('Unlocked Levels:', updatedProgress.unlocked_levels);
    console.log('Completed Levels:', updatedProgress.completed_levels);
    
    console.log('\n✅ All levels (1-5) are now unlocked and completed!');
    console.log('🎮 You can now access any level in the game.');
    
  } catch (error) {
    console.error('Error during unlock all levels:', error);
  } finally {
    mongoose.connection.close();
  }
}

unlockAllLevelsForUser();