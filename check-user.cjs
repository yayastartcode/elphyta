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

async function checkUser() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');
    
    // Check if test user exists
    const user = await User.findOne({ email: 'test@example.com' });
    
    if (!user) {
      console.log('❌ Test user does not exist. Creating user...');
      
      // Create test user
      const hashedPassword = await bcrypt.hash('password123', 10);
      const newUser = new User({
        email: 'test@example.com',
        password_hash: hashedPassword,
        name: 'Test User',
        role: 'player'
      });
      
      await newUser.save();
      console.log('✅ Test user created successfully');
    } else {
      console.log('✅ Test user exists');
      
      // Verify password
      const isValidPassword = await bcrypt.compare('password123', user.password_hash);
      if (isValidPassword) {
        console.log('✅ Password is correct');
      } else {
        console.log('❌ Password is incorrect. Updating password...');
        
        // Update password
        const hashedPassword = await bcrypt.hash('password123', 10);
        user.password_hash = hashedPassword;
        await user.save();
        console.log('✅ Password updated successfully');
      }
    }
    
    await mongoose.disconnect();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUser();