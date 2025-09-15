const jwt = require('jsonwebtoken');
const { exec } = require('child_process');

const JWT_SECRET = 'elphyta-super-secret-jwt-key-2024';
const userId = '68c6fc508f7d9cbeb7e60e7d';
const email = 'test@example.com';

// Generate JWT token
const token = jwt.sign(
  { userId, email },
  JWT_SECRET,
  { expiresIn: '7d' }
);

console.log('Generated token:', token);

// Test the /game/progress endpoint to see the actual response structure
const curlCommand = `curl -X GET http://localhost:3001/game/progress \
  -H "Authorization: Bearer ${token}" \
  -w "\n%{http_code}\n" \
  -s`;

console.log('\nExecuting curl command...');
exec(curlCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error);
    return;
  }
  if (stderr) {
    console.error('Stderr:', stderr);
  }
  console.log('\n=== API Response ===');
  console.log(stdout);
  
  // Try to parse and pretty print the JSON
  try {
    const lines = stdout.trim().split('\n');
    const httpCode = lines[lines.length - 1];
    const jsonResponse = lines.slice(0, -1).join('\n');
    
    console.log('\n=== HTTP Code ===');
    console.log(httpCode);
    
    console.log('\n=== Parsed JSON ===');
    const parsed = JSON.parse(jsonResponse);
    console.log(JSON.stringify(parsed, null, 2));
    
    console.log('\n=== Data Analysis ===');
    if (parsed.success && parsed.data) {
      console.log('Progress array length:', parsed.data.progress ? parsed.data.progress.length : 'undefined');
      console.log('LevelScores array length:', parsed.data.levelScores ? parsed.data.levelScores.length : 'undefined');
      console.log('Progress data:', parsed.data.progress);
      console.log('LevelScores data:', parsed.data.levelScores);
    }
  } catch (parseError) {
    console.error('Failed to parse JSON:', parseError.message);
  }
});