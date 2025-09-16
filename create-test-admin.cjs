// Create a test admin user for debugging
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User schema (simplified)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['player', 'admin'], default: 'player' }
});

const User = mongoose.model('User', userSchema);

async function createTestAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Check if test admin already exists
    const existingAdmin = await User.findOne({ email: 'testadmin@example.com' });
    if (existingAdmin) {
      console.log('Test admin already exists');
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('testadmin123', 10);

    // Create test admin
    const testAdmin = new User({
      name: 'Test Admin',
      email: 'testadmin@example.com',
      password_hash: hashedPassword,
      role: 'admin'
    });

    await testAdmin.save();
    console.log('✅ Test admin created successfully!');
    console.log('Email: testadmin@example.com');
    console.log('Password: testadmin123');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error creating test admin:', error.message);
    await mongoose.disconnect();
  }
}

createTestAdmin();