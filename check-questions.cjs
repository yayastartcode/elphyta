require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    return checkQuestions();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define Question schema (simplified)
const questionSchema = new mongoose.Schema({
  question_text: String,
  correct_answer: String,
  question_type: String,
  level: Number,
  game_mode: String,
  question_order: Number
});

const Question = mongoose.model('Question', questionSchema);

async function checkQuestions() {
  try {
    console.log('\n=== CHECKING QUESTIONS IN DATABASE ===');
    
    // Check all questions
    const allQuestions = await Question.find({}).limit(10);
    console.log('Total questions found:', allQuestions.length);
    
    if (allQuestions.length > 0) {
      console.log('\nFirst few questions:');
      allQuestions.forEach((q, index) => {
        console.log(`${index + 1}. Level: ${q.level}, Mode: ${q.game_mode}, Type: ${q.question_type}`);
        console.log(`   Question: ${q.question_text}`);
        console.log(`   Answer: ${q.correct_answer}`);
        console.log(`   Order: ${q.question_order}`);
        console.log('');
      });
    }
    
    // Check specifically for addition level 1
    const additionLevel1 = await Question.find({
      level: 1,
      game_mode: 'addition'
    });
    console.log('\nAddition Level 1 questions found:', additionLevel1.length);
    
    // Check all game modes
    const gameModes = await Question.distinct('game_mode');
    console.log('\nAvailable game modes:', gameModes);
    
    // Check all levels
    const levels = await Question.distinct('level');
    console.log('Available levels:', levels);
    
    // Check level/mode combinations
    const combinations = await Question.aggregate([
      {
        $group: {
          _id: { level: '$level', game_mode: '$game_mode' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.level': 1, '_id.game_mode': 1 } }
    ]);
    
    console.log('\nLevel/Mode combinations:');
    combinations.forEach(combo => {
      console.log(`Level ${combo._id.level}, Mode: ${combo._id.game_mode}, Count: ${combo.count}`);
    });
    
  } catch (error) {
    console.error('Error checking questions:', error);
  } finally {
    mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}