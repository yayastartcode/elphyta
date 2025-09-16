const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dap')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define User schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  created_at: { type: Date, default: Date.now },
  last_login: { type: Date }
});

const User = mongoose.model('User', UserSchema);

async function debugUsers() {
  try {
    console.log('\n=== Debugging Users ===');
    
    const users = await User.find({}).limit(5);
    console.log(`Total users found: ${users.length}`);
    
    users.forEach((user, index) => {
      console.log(`\n--- User ${index + 1} ---`);
      console.log('ID:', user._id);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Created:', user.created_at);
    });
    
  } catch (error) {
    console.error('Error debugging users:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugUsers();