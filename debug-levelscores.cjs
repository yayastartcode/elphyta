const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dap')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define LevelScore schema
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

async function debugLevelScores() {
  try {
    console.log('\n=== Debugging LevelScores ===');
    
    // Find all level score records
    const allScores = await LevelScore.find({}).sort({ completed_at: -1 }).limit(20);
    console.log('\nTotal LevelScore records (last 20):', allScores.length);
    
    allScores.forEach((score, index) => {
      console.log(`\n--- Score Record ${index + 1} ---`);
      console.log('User ID:', score.user_id);
      console.log('Game Mode:', score.game_mode);
      console.log('Level:', score.level);
      console.log('Total Score:', score.total_score);
      console.log('Questions Correct:', score.questions_correct);
      console.log('Total Time:', score.total_time);
      console.log('Is Completed:', score.is_completed);
      console.log('Attempts:', score.attempts);
      console.log('Completed At:', score.completed_at);
    });
    
  } catch (error) {
    console.error('Error debugging level scores:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugLevelScores();