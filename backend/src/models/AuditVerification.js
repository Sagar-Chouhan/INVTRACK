import mongoose from 'mongoose'

const auditVerificationSchema = new mongoose.Schema(
  {
    issue_id: { type: mongoose.Schema.Types.ObjectId, ref: 'IssuedStock', required: true },
    stock_id: { type: mongoose.Schema.Types.ObjectId, ref: 'StockInventory', required: true },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    verified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product_name: { type: String, required: true, trim: true },
    category_name: { type: String, required: true, trim: true },
    unit: { type: String, trim: true },
    issued_qty: { type: Number, required: true, min: 0 },
    recipient_name: { type: String, trim: true },
    purpose: { type: String, trim: true },
    photo_url: { type: String, required: true },
    photo_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AuditPhoto' },
    photo_expires_at: { type: Date },
    used_qty: { type: Number, required: true, min: 0 },
    returned_good: { type: Number, required: true, min: 0 },
    returned_faulty: { type: Number, required: true, min: 0 },
    fault_reason: { type: String, trim: true },
    status: { type: String, enum: ['verified', 'rejected'], default: 'verified' },
    verification_date: { type: Date, default: Date.now },
    verified_at: { type: Date, default: Date.now },
  },
  { versionKey: false },
)

export const AuditVerification = mongoose.model('AuditVerification', auditVerificationSchema)
