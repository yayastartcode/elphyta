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

// Test data for submission (matching API expected format)
const testData = {
  gameMode: 'truth',
  level: '1',
  answers: ['A', 'A', 'A', 'A', 'A'], // Array of user answers (using 'A' for multiple choice)
  timeSpent: 5500
};

// Create curl command with verbose output
const curlCommand = `curl -v -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${token}" \
  -d '${JSON.stringify(testData)}' \
  http://localhost:3001/game/submit`;

console.log('\nSubmitting to API with detailed output...');
console.log('Curl command:', curlCommand);

exec(curlCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('Error executing curl:', error);
    return;
  }
  
  console.log('\n=== CURL VERBOSE OUTPUT ===');
  console.log('Stderr:', stderr);
  
  console.log('\n=== API RESPONSE ===');
  console.log('Response:', stdout);
  
  try {
    const response = JSON.parse(stdout);
    console.log('\n=== PARSED RESPONSE ===');
    console.log('Success:', response.success);
    console.log('Message:', response.message);
    if (response.data) {
      console.log('Data:', JSON.stringify(response.data, null, 2));
    }
  } catch (parseError) {
    console.error('Failed to parse response as JSON:', parseError.message);
  }
});