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

// Test adding some initial progress data
const progressData = {
  game_mode: 'addition',
  unlocked_levels: [1, 2],
  completed_levels: [1],
  current_level: 2,
  total_score: 85
};

const curlCommand = `curl -X POST http://localhost:3001/game/progress \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${token}" \
  -d '${JSON.stringify(progressData)}' \
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
  console.log('Response:', stdout);
});