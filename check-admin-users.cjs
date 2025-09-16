const mongoose = require('mongoose');
require('dotenv').config();

// User schema (simplified for CommonJS)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['player', 'admin'], default: 'player' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

async function checkAdminUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');
    
    const users = await User.find({}, 'email name role');
    console.log('\nUsers with roles:');
    console.log('==================');
    
    let adminCount = 0;
    users.forEach(user => {
      const role = user.role || 'player';
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log(`Role: ${role}`);
      console.log('---');
      
      if (role === 'admin') {
        adminCount++;
      }
    });
    
    console.log(`\nTotal users: ${users.length}`);
    console.log(`Admin users: ${adminCount}`);
    
    if (adminCount === 0) {
      console.log('\n⚠️  No admin users found! You need to create an admin user to access the admin dashboard.');
    } else {
      console.log('\n✅ Admin users found!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkAdminUsers();