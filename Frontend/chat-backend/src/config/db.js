import mongoose from 'mongoose'

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI

  if (!mongoURI) {
    throw new Error('MONGODB_URI is not configured in environment variables')
  }

  await mongoose.connect(mongoURI)
  console.log('MongoDB connected')
}
