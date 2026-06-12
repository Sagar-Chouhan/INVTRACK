import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      required: true,
    },
    socketId: {
      type: String,
      default: null,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

UserSchema.index({ name: 1, role: 1 }, { unique: true })

export const User = mongoose.model('User', UserSchema)
