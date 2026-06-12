import mongoose from 'mongoose'

const issuedStockSchema = new mongoose.Schema(
  {
    stock_id: { type: mongoose.Schema.Types.ObjectId, ref: 'StockInventory', required: true },
    recipient_name: { type: String, required: true, trim: true },
    recipient_mobile: { type: String, trim: true },
    incharge_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Incharge' }, // Reference to Incharge model
    issued_qty: { type: Number, required: true, min: 1 },
    issued_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending-audit', 'verified', 'returned'],
      default: 'pending-audit',
    },
    purpose: { type: String, trim: true },
    created_at: { type: Date, default: Date.now },
    verification_deadline: { type: Date, required: true },
    otp_sent: { type: Boolean, default: false },
    notification_sent_at: { type: Date },
  },
  { versionKey: false },
)

issuedStockSchema.pre('validate', function () {
  if (!this.verification_deadline) {
    const created = this.created_at || new Date()
    this.verification_deadline = new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000)
  }
})

export const IssuedStock = mongoose.model('IssuedStock', issuedStockSchema)
