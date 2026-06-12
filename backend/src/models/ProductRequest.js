import mongoose from 'mongoose'

const productRequestSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    unit: {
      type: String,
      required: true,
      enum: ['Piece', 'Kg', 'Litre', 'Box', 'Bag', 'Meter', 'Gram'],
      default: 'Piece',
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending',
    },
    adminResponse: {
      type: String,
      trim: true,
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

export const ProductRequest = mongoose.model('ProductRequest', productRequestSchema)
