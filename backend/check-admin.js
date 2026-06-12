import mongoose from 'mongoose';
import { User } from './src/models/User.js';

const MONGODB_URI = 'mongodb+srv://testuser:testpass1234@cluster0.czdwon2.mongodb.net/invtrack';

async function checkAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully');

    console.log('\nSearching for admin user with email: admin@example.com');
    const admin = await User.findOne({ email: 'admin@example.com' });
    
    if (admin) {
      console.log('\n✅ Admin user found:');
      console.log('ID:', admin._id);
      console.log('Full Name:', admin.full_name);
      console.log('Email:', admin.email);
      console.log('Mobile:', admin.mobile);
      console.log('Role:', admin.role);
      console.log('Password Hash:', admin.password_hash ? 'Present' : 'Missing');
    } else {
      console.log('\n❌ Admin user NOT found!');
      console.log('\nSearching all users...');
      const allUsers = await User.find({});
      console.log(`Total users in database: ${allUsers.length}`);
      allUsers.forEach(user => {
        console.log(`- ${user.email} (${user.role})`);
      });
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkAdmin();
