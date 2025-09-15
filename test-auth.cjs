const jwt = require('jsonwebtoken');
const { execSync } = require('child_process');

const token = jwt.sign(
  { userId: '68c6fc508f7d9cbeb7e60e7d', email: 'test@example.com' },
  'elphyta-super-secret-jwt-key-2024'
);

console.log('Generated token:', token);

try {
  const result = execSync(
    `curl -X GET "http://localhost:3001/game/progress" -H "Authorization: Bearer ${token}" -H "Content-Type: application/json"`,
    { encoding: 'utf8' }
  );
  console.log('Response:', result);
} catch (error) {
  console.error('Error:', error.message);
}