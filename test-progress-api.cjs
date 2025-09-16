const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testProgressAPI() {
  try {
    console.log('\n=== TESTING PROGRESS API ===');
    
    // Generate JWT token with correct format (userId, not _id)
    const token = jwt.sign(
      {
        userId: '68c6fc508f7d9cbeb7e60e7d',
        email: 'test@test.com',
        role: 'user'
      },
      process.env.JWT_SECRET
    );
    
    console.log('Generated token for API test');
    
    // Test the progress API endpoint
    const { spawn } = require('child_process');
    
    const curlCommand = [
      'curl',
      '-H', `Authorization: Bearer ${token}`,
      '-H', 'Content-Type: application/json',
      'http://localhost:3001/game/progress'
    ];
    
    console.log('\nCalling API:', curlCommand.join(' '));
    
    const curl = spawn('curl', [
      '-H', `Authorization: Bearer ${token}`,
      '-H', 'Content-Type: application/json',
      'http://localhost:3001/game/progress'
    ]);
    
    let output = '';
    let errorOutput = '';
    
    curl.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    curl.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    curl.on('close', (code) => {
      console.log('\n=== API RESPONSE ===');
      if (code === 0) {
        try {
          const response = JSON.parse(output);
          console.log('Success:', response.success);
          console.log('Message:', response.message);
          console.log('Full response:', JSON.stringify(response, null, 2));
          
          if (response.data && response.data.progress) {
            console.log('\n=== USER PROGRESS FROM API ===');
            response.data.progress.forEach((progress, index) => {
              console.log(`${index + 1}. Game Mode: ${progress.game_mode}`);
              console.log(`   Current Level: ${progress.current_level}`);
              console.log(`   Unlocked Levels: [${progress.unlocked_levels.join(', ')}]`);
              console.log(`   Completed Levels: [${progress.completed_levels.join(', ')}]`);
              console.log(`   Total Score: ${progress.total_score}`);
            });
          }
          
          if (response.data && response.data.levelScores) {
            console.log('\n=== LEVEL SCORES FROM API ===');
            response.data.levelScores.forEach((score, index) => {
              console.log(`${index + 1}. Mode: ${score.game_mode}, Level: ${score.level}`);
              console.log(`   Score: ${score.total_score}, Correct: ${score.questions_correct}`);
              console.log(`   Completed: ${score.is_completed}, Attempts: ${score.attempts}`);
            });
          }
          
        } catch (parseError) {
          console.log('Raw response:', output);
          console.error('Failed to parse JSON:', parseError.message);
        }
      } else {
        console.log('Error code:', code);
        console.log('Error output:', errorOutput);
        console.log('Raw output:', output);
      }
    });
    
  } catch (error) {
    console.error('Error testing progress API:', error);
  }
}

testProgressAPI();