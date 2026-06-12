import mongoose from 'mongoose'

const inchargeSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    department: { type: String, trim: true },
    designation: { type: String, trim: true },
    added_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
)

export const Incharge = mongoose.model('Incharge', inchargeSchema)
