const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dap')
  .then(() => console.log('Connected to database'))
  .catch(err => console.error('Database connection error:', err));

// Simple User schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password_hash: String,
  role: { type: String, enum: ['player', 'admin'], default: 'player' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

async function generateAdminToken() {
  try {
    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@elphyta.online' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Admin user found:', {
      id: adminUser._id,
      email: adminUser.email,
      role: adminUser.role
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: adminUser._id.toString(), 
        email: adminUser.email,
        role: adminUser.role
      },
      process.env.JWT_SECRET || 'elphyta-super-secret-jwt-key-2024',
      { expiresIn: '7d' }
    );
    
    console.log('\n🔑 Generated admin token:');
    console.log(token);
    
    // Test the token
    console.log('\n🧪 Testing token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'elphyta-super-secret-jwt-key-2024');
    console.log('✅ Token is valid:', decoded);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

generateAdminToken();