require('dotenv').config();
const jwt = require('jsonwebtoken');
const { exec } = require('child_process');

// Test user data (using existing user from debug-users.cjs output)
const testUser = {
  userId: '68c6fc508f7d9cbeb7e60e7d',
  email: 'test@example.com',
  role: 'player'
};

// Generate JWT token
const token = jwt.sign(testUser, process.env.JWT_SECRET, { expiresIn: '1h' });
console.log('Generated token for user:', testUser.userId);

// Test data matching EXACTLY what the frontend now sends
const frontendData = {
  gameMode: 'truth',
  level: 1,
  answers: ['A', 'A', 'A', 'A', 'A'],
  timeSpent: 45 // 45 seconds
};

console.log('\n=== TESTING FRONTEND FORMAT ===');
console.log('Data being sent:', JSON.stringify(frontendData, null, 2));

// Create curl command
const curlCommand = `curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${token}" \
  -d '${JSON.stringify(frontendData)}' \
  http://localhost:3001/game/submit`;

console.log('\nSubmitting with frontend format...');

exec(curlCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('Error executing curl:', error);
    return;
  }
  
  console.log('\n=== API RESPONSE ===');
  console.log('Response:', stdout);
  
  try {
    const response = JSON.parse(stdout);
    console.log('\n=== PARSED RESPONSE ===');
    console.log('Success:', response.success);
    console.log('Message:', response.message);
    if (response.data) {
      console.log('Score:', response.data.score);
      console.log('Correct Answers:', response.data.correctAnswers);
      console.log('Percentage:', response.data.percentage);
      console.log('Next Level Unlocked:', response.data.nextLevelUnlocked);
    }
  } catch (parseError) {
    console.error('Failed to parse response as JSON:', parseError.message);
  }
});