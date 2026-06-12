import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'auditor', 'user'], default: 'user' },
    assigned_categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    last_audit_reminder_sent_at: { type: Date },
    reset_otp: { type: String },
    reset_otp_expires: { type: Date },
  },
  { 
    versionKey: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  },
)

export const User = mongoose.model('User', userSchema)
