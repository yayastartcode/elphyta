import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './api/models/User.ts';
import dotenv from 'dotenv';

dotenv.config();

async function createAdmin() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database successfully');
    
    // Check if admin user already exists
    const adminExists = await User.findOne({ email: 'testadmin@example.com' });
    
    if (adminExists) {
      console.log('Admin user already exists:', {
        email: adminExists.email,
        role: adminExists.role,
        name: adminExists.name
      });
      
      // Update role to admin if it's not already
      if (adminExists.role !== 'admin') {
        adminExists.role = 'admin';
        await adminExists.save();
        console.log('Updated user role to admin');
      }
    } else {
      console.log('Creating new admin user...');
      const hashedPassword = await bcrypt.hash('testadmin123', 10);
      
      const admin = new User({
        name: 'Test Admin',
        email: 'testadmin@example.com',
        password_hash: hashedPassword,
        role: 'admin'
      });
      
      await admin.save();
      console.log('Admin user created successfully:', {
        email: admin.email,
        role: admin.role,
        name: admin.name
      });
    }
    
    console.log('\nAdmin credentials:');
    console.log('Email: testadmin@example.com');
    console.log('Password: testadmin123');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
    process.exit(0);
  }
}

createAdmin();