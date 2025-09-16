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

async function fixProgressIssue() {
  try {
    console.log('\n=== Fixing Progress Issue ===');
    
    // Find a user who has completed levels but progress shows empty completed_levels
    const userProgress = await UserProgress.findOne({ 
      game_mode: 'truth',
      completed_levels: { $size: 0 } // Empty completed_levels array
    });
    
    if (!userProgress) {
      console.log('No UserProgress found with empty completed_levels');
      return;
    }
    
    console.log('\nFound UserProgress with issue:');
    console.log('User ID:', userProgress.user_id);
    console.log('Game Mode:', userProgress.game_mode);
    console.log('Current Level:', userProgress.current_level);
    console.log('Unlocked Levels:', userProgress.unlocked_levels);
    console.log('Completed Levels (before):', userProgress.completed_levels);
    console.log('Level 1 completion:', userProgress.level_completion.level_1);
    
    // Check if level 1 is marked as completed in level_completion but not in completed_levels
    if (userProgress.level_completion.level_1.completed && !userProgress.completed_levels.includes(1)) {
      console.log('\nFound inconsistency: Level 1 is marked completed but not in completed_levels array');
      
      // Fix the inconsistency
      userProgress.completed_levels.push(1);
      console.log('Added level 1 to completed_levels array');
      
      // Save the fix
      await userProgress.save();
      console.log('UserProgress updated successfully');
      
      // Verify the fix
      const updatedProgress = await UserProgress.findById(userProgress._id);
      console.log('\nAfter fix - Completed Levels:', updatedProgress.completed_levels);
    } else {
      console.log('\nNo inconsistency found or level 1 not completed');
    }
    
    // Now let's manually complete level 1 for this user to test the logic
    console.log('\n=== Testing Level 1 Completion ===');
    
    // Simulate completing level 1 with a good score
    userProgress.level_completion.level_1 = {
      completed: true,
      score: 80,
      completed_at: new Date()
    };
    
    // Add to completed_levels if not already there
    if (!userProgress.completed_levels.includes(1)) {
      userProgress.completed_levels.push(1);
      console.log('Added level 1 to completed_levels');
    }
    
    // Unlock level 2 since score is >= 60%
    if (!userProgress.unlocked_levels.includes(2)) {
      userProgress.unlocked_levels.push(2);
      console.log('Unlocked level 2');
    }
    
    // Update current level
    if (userProgress.current_level < 2) {
      userProgress.current_level = 2;
      console.log('Updated current level to 2');
    }
    
    // Save the changes
    await userProgress.save();
    console.log('\nProgress saved successfully');
    
    // Final verification
    const finalProgress = await UserProgress.findById(userProgress._id);
    console.log('\nFinal state:');
    console.log('Current Level:', finalProgress.current_level);
    console.log('Unlocked Levels:', finalProgress.unlocked_levels);
    console.log('Completed Levels:', finalProgress.completed_levels);
    console.log('Level 1 completion:', finalProgress.level_completion.level_1);
    
  } catch (error) {
    console.error('Error fixing progress:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixProgressIssue();