import mongoose from 'mongoose'

const stockInventorySchema = new mongoose.Schema(
  {
    product_name: { type: String, required: true, trim: true },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: {
      type: String,
      enum: ['Pcs', 'Kg', 'Ltr', 'Mtr', 'Box', 'Set'],
      required: true,
    },
    location: { type: String, trim: true },
    source_type: { type: String, enum: ['purchase', 'donation'], default: 'purchase' },
    supplier_donor_name: { type: String, trim: true },
    received_date: { type: Date, default: Date.now },
    unit_price: { type: Number, default: 0 },
    notes: { type: String, trim: true },
  },
  { 
    versionKey: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  },
)

export const StockInventory = mongoose.model('StockInventory', stockInventorySchema)
