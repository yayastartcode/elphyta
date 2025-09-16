const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User schema (simplified)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['player', 'admin'], default: 'player' }
});

const User = mongoose.model('User', UserSchema);

async function checkAdminPassword() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');
    
    // Check if admin user exists
    const admin = await User.findOne({ email: 'admin@elphyta.online' });
    
    if (!admin) {
      console.log('❌ Admin user does not exist');
      return;
    }
    
    console.log('✅ Admin user exists:', admin.email);
    
    // Test common passwords
    const testPasswords = ['admin123', 'password', 'admin', '123456', 'password123'];
    
    for (const password of testPasswords) {
      const isValid = await bcrypt.compare(password, admin.password_hash);
      if (isValid) {
        console.log(`✅ Admin password is: ${password}`);
        await mongoose.disconnect();
        return;
      }
    }
    
    console.log('❌ None of the common passwords work. Setting password to "admin123"...');
    
    // Update password to admin123
    const hashedPassword = await bcrypt.hash('admin123', 10);
    admin.password_hash = hashedPassword;
    await admin.save();
    console.log('✅ Admin password updated to "admin123"');
    
    await mongoose.disconnect();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAdminPassword();