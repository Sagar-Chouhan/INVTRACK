import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './src/models/User.js';

const MONGODB_URI = 'mongodb+srv://testuser:testpass1234@cluster0.czdwon2.mongodb.net/invtrack';

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected successfully\n');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      console.log('\nDeleting old admin and creating new one...');
      await User.deleteOne({ email: 'admin@example.com' });
    }

    // Create admin user with correct password
    const adminPassword = 'Admin@1234';
    const password_hash = await bcrypt.hash(adminPassword, 10);
    
    const admin = await User.create({
      full_name: 'Administrator',
      email: 'admin@example.com',
      mobile: '9999999999',
      password_hash: password_hash,
      role: 'admin',
      assigned_categories: []
    });

    console.log('✅ Admin user created successfully!');
    console.log('\nAdmin Credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: Admin@1234');
    console.log('\nUser Details:');
    console.log('ID:', admin._id);
    console.log('Full Name:', admin.full_name);
    console.log('Mobile:', admin.mobile);
    console.log('Role:', admin.role);

    await mongoose.disconnect();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createAdmin();
