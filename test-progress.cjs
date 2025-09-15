const jwt = require('jsonwebtoken');
const { exec } = require('child_process');

// Use the same JWT_SECRET and user data from the working test
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

// Test the /game/progress endpoint
const curlCommand = `curl -X GET "http://localhost:3001/game/progress" \
  -H "Authorization: Bearer ${token}" \
  -H "Content-Type: application/json" \
  -v`;

console.log('Testing /game/progress endpoint...');
console.log('Command:', curlCommand);

exec(curlCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Response:', stdout);
  if (stderr) {
    console.log('Curl details:', stderr);
  }
});