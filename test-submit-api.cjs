const jwt = require('jsonwebtoken');
require('dotenv').config();
const { exec } = require('child_process');

async function testSubmitAPI() {
  try {
    // Create a test JWT token
    const testUser = {
      userId: '68c6fc508f7d9cbeb7e60e7d', // Use an existing user ID from our debug
      email: 'test@example.com',
      role: 'player'
    };
    
    const token = jwt.sign(testUser, process.env.JWT_SECRET);
    
    console.log('Generated token for user:', testUser.userId);
    
    // Test submit endpoint
    const submitData = {
      gameMode: 'truth',
      level: 1,
      answers: [
        { questionId: '507f1f77bcf86cd799439011', answer: 'test answer 1' },
        { questionId: '507f1f77bcf86cd799439012', answer: 'test answer 2' },
        { questionId: '507f1f77bcf86cd799439013', answer: 'test answer 3' }
      ],
      timeSpent: 120
    };
    
    console.log('\nSubmitting to API...');
    
    const curlCommand = `curl -X POST http://localhost:3001/game/submit \
      -H "Authorization: Bearer ${token}" \
      -H "Content-Type: application/json" \
      -d '${JSON.stringify(submitData)}'`;
    
    exec(curlCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('Error:', error);
        return;
      }
      if (stderr) {
        console.error('Stderr:', stderr);
      }
      console.log('Response:', stdout);
    });
    
  } catch (error) {
    console.error('Error testing submit API:', error.message);
  }
}

testSubmitAPI();

// Keep the process alive for a moment to see the curl response
setTimeout(() => {
  process.exit(0);
}, 3000);