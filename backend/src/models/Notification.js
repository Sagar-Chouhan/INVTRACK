import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    recipient_name: { type: String, required: true, trim: true },
    recipient_mobile: { type: String, trim: true },
    recipient_email: { type: String, trim: true, lowercase: true },
    product_name: { type: String, trim: true },
    quantity: { type: Number },
    unit: { type: String },
    issued_by_name: { type: String, trim: true },
    purpose: { type: String, trim: true },
    otp: { type: String },
    issue_id: { type: mongoose.Schema.Types.ObjectId, ref: 'IssuedStock' },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: ['stock_issuance', 'request_response', 'audit_reminder', 'low_stock', 'system'],
      default: 'stock_issuance',
    },
    title: { type: String, trim: true },
    message: { type: String, trim: true },
    sent_via: {
      type: String,
      enum: ['email', 'sms', 'both', 'none'],
      default: 'none',
    },
    read: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

export const Notification = mongoose.model('Notification', notificationSchema)
