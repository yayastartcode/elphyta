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

async function unlockAllLevels() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');
    
    // Update all UserProgress records to unlock all levels (1-5)
    const result = await UserProgress.updateMany(
      {}, // Update all records
      {
        $set: {
          unlocked_levels: [1, 2, 3, 4, 5],
          current_level: 5,
          last_updated: new Date()
        }
      }
    );
    
    console.log(`Updated ${result.modifiedCount} UserProgress records`);
    console.log('All levels (1-5) are now unlocked for all users');
    
    // Verify the update
    const updatedRecords = await UserProgress.find({});
    console.log('\nVerification:');
    updatedRecords.forEach(record => {
      console.log(`User: ${record.user_id}, Mode: ${record.game_mode}, Unlocked: [${record.unlocked_levels.join(', ')}]`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

unlockAllLevels();