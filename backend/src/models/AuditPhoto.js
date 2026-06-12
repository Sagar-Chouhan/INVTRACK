import mongoose from 'mongoose'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

const auditPhotoSchema = new mongoose.Schema(
  {
    uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    image_data: { type: Buffer, required: true },
    mime_type: { type: String, enum: ['image/jpeg', 'image/png'], required: true },
    file_size: { type: Number, required: true },
    expires_at: {
      type: Date,
      default: () => new Date(Date.now() + THIRTY_DAYS_MS),
      index: { expires: 0 },
    },
  },
  { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: false } },
)

export const AuditPhoto = mongoose.model('AuditPhoto', auditPhotoSchema)