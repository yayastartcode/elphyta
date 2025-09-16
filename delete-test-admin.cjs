// Delete the test admin user to recreate it properly
require('dotenv').config();
const mongoose = require('mongoose');

// User schema (simplified)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['player', 'admin'], default: 'player' }
});

const User = mongoose.model('User', userSchema);

async function deleteTestAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Delete test admin
    const result = await User.deleteOne({ email: 'testadmin@example.com' });
    
    if (result.deletedCount > 0) {
      console.log('✅ Test admin deleted successfully!');
    } else {
      console.log('ℹ️ Test admin not found');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error deleting test admin:', error.message);
    await mongoose.disconnect();
  }
}

deleteTestAdmin();