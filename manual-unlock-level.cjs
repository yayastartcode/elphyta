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

async function manualUnlockLevel() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    console.log('\n=== MANUAL LEVEL UNLOCK ===');
    
    // Find the user's progress
    const userProgress = await UserProgress.findOne({
      user_id: new mongoose.Types.ObjectId('68c6fc508f7d9cbeb7e60e7d'),
      game_mode: 'truth'
    });
    
    if (!userProgress) {
      console.log('No UserProgress found');
      return;
    }
    
    console.log('\nBefore manual unlock:');
    console.log('Current Level:', userProgress.current_level);
    console.log('Unlocked Levels:', userProgress.unlocked_levels);
    console.log('Completed Levels:', userProgress.completed_levels);
    console.log('Level 1 Score:', userProgress.level_completion.level_1.score);
    
    // Manually set a perfect score for level 1
    const perfectScore = 100;
    const perfectCorrectAnswers = 5;
    const totalQuestions = 5;
    
    // Update level 1 completion with perfect score
    userProgress.level_completion.level_1 = {
      completed: true,
      score: perfectScore,
      completed_at: new Date()
    };
    
    // Ensure level 1 is in completed_levels
    if (!userProgress.completed_levels.includes(1)) {
      userProgress.completed_levels.push(1);
    }
    
    // Calculate score percentage (should be 100%)
    const scorePercentage = (perfectCorrectAnswers / totalQuestions) * 100;
    console.log('\nScore percentage:', scorePercentage + '%');
    
    // Unlock next levels based on perfect score
    if (scorePercentage >= 60) {
      // Unlock level 2
      if (!userProgress.unlocked_levels.includes(2)) {
        userProgress.unlocked_levels.push(2);
        console.log('Unlocked level 2');
      }
      
      // Unlock level 3 as well since it's a perfect score
      if (!userProgress.unlocked_levels.includes(3)) {
        userProgress.unlocked_levels.push(3);
        console.log('Unlocked level 3');
      }
      
      // Update current level to 2
      if (userProgress.current_level < 2) {
        userProgress.current_level = 2;
        console.log('Updated current level to 2');
      }
    }
    
    // Save the changes
    await userProgress.save();
    console.log('\nUserProgress updated successfully');
    
    // Also update or create LevelScore record
    const existingLevelScore = await LevelScore.findOne({
      user_id: new mongoose.Types.ObjectId('68c6fc508f7d9cbeb7e60e7d'),
      game_mode: 'truth',
      level: 1
    });
    
    if (existingLevelScore) {
      existingLevelScore.total_score = perfectScore;
      existingLevelScore.questions_correct = perfectCorrectAnswers;
      existingLevelScore.is_completed = true;
      existingLevelScore.completed_at = new Date();
      await existingLevelScore.save();
      console.log('Updated existing LevelScore record');
    } else {
      const newLevelScore = new LevelScore({
        user_id: new mongoose.Types.ObjectId('68c6fc508f7d9cbeb7e60e7d'),
        game_mode: 'truth',
        level: 1,
        total_score: perfectScore,
        questions_correct: perfectCorrectAnswers,
        total_time: 60,
        is_completed: true,
        attempts: 1
      });
      await newLevelScore.save();
      console.log('Created new LevelScore record');
    }
    
    // Verify the changes
    const updatedProgress = await UserProgress.findById(userProgress._id);
    console.log('\nAfter manual unlock:');
    console.log('Current Level:', updatedProgress.current_level);
    console.log('Unlocked Levels:', updatedProgress.unlocked_levels);
    console.log('Completed Levels:', updatedProgress.completed_levels);
    console.log('Level 1 Score:', updatedProgress.level_completion.level_1.score);
    
    console.log('\n✅ Manual unlock completed! Next levels should now be available.');
    
  } catch (error) {
    console.error('Error during manual unlock:', error);
  } finally {
    mongoose.connection.close();
  }
}

manualUnlockLevel();