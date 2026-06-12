import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import {
  MONGODB_URI,
  ADMIN_FULL_NAME,
  ADMIN_MOBILE,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
} from './config.js'
import { User } from './models/User.js'
import { Category } from './models/Category.js'

async function ensureAdminUser() {
  try {
    const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase(), role: 'admin' })
    if (existing) {
      return
    }

    const password_hash = await bcrypt.hash(ADMIN_PASSWORD, 10)
    await User.create({
      full_name: ADMIN_FULL_NAME,
      mobile: ADMIN_MOBILE,
      email: ADMIN_EMAIL,
      password_hash,
      role: 'admin',
    })
    console.log('Default admin user created with email:', ADMIN_EMAIL)
  } catch (err) {
    console.error('Error ensuring admin user exists', err)
  }
}

async function ensureCategories() {
  try {
    const count = await Category.countDocuments()
    if (count > 0) return

    const defaultCategories = [
      'Electrical', 'Plumbing', 'Carpentry', 'Stationery', 
      'Tools', 'Safety Equipment', 'Cleaning Supplies', 
      'Hardware', 'Furniture', 'Other'
    ]

    await Category.insertMany(defaultCategories.map(name => ({ name })))
    console.log('Default categories seeded')
  } catch (err) {
    console.error('Error seeding categories:', err)
  }
}

export async function connectMongo() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined. Please set it in your .env file.')
    process.exit(1)
  }

  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('MongoDB connected successfully')
    console.log('Database:', mongoose.connection.db.databaseName)
    await ensureAdminUser()
    await ensureCategories()
  } catch (err) {
    console.error('MongoDB connection error:', err.message)
    process.exit(1)
  }
}
