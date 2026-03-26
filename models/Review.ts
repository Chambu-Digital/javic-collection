import mongoose from 'mongoose'

export interface IReview {
  _id?: string
  productId: mongoose.Types.ObjectId
  userId?: mongoose.Types.ObjectId
  orderId: mongoose.Types.ObjectId
  orderItemId: string

  rating: number
  title?: string
  comment: string
  images?: string[]

  customerName: string
  customerEmail?: string
  customerPhone?: string

  isVerifiedPurchase: boolean

  // Source of review
  source: 'whatsapp_link' | 'logged_in'
  review_token?: string

  status: 'pending' | 'approved' | 'rejected'
  moderatedBy?: mongoose.Types.ObjectId
  moderatedAt?: Date
  moderationNotes?: string

  helpfulVotes: number
  totalVotes: number

  createdAt?: Date
  updatedAt?: Date
}

const ReviewSchema = new mongoose.Schema<IReview>({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  orderItemId: { type: String, required: true },

  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, trim: true, maxlength: 100 },
  comment: { type: String, trim: true, maxlength: 1000 },
  images: [{ type: String }],

  customerName: { type: String, required: true, trim: true },
  customerEmail: { type: String, lowercase: true },
  customerPhone: { type: String, trim: true },

  isVerifiedPurchase: { type: Boolean, default: true },

  source: {
    type: String,
    enum: ['whatsapp_link', 'logged_in'],
    required: true
  },
  review_token: { type: String },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  moderatedAt: Date,
  moderationNotes: { type: String, maxlength: 500 },

  helpfulVotes: { type: Number, default: 0, min: 0 },
  totalVotes: { type: Number, default: 0, min: 0 }
}, { timestamps: true })

// Prevent duplicate reviews per product per order item
ReviewSchema.index({ productId: 1, orderId: 1, orderItemId: 1 }, { unique: true })
ReviewSchema.index({ productId: 1, status: 1, createdAt: -1 })
ReviewSchema.index({ userId: 1, createdAt: -1 })
ReviewSchema.index({ status: 1, createdAt: -1 })
ReviewSchema.index({ review_token: 1 })

if (mongoose.models.Review) delete mongoose.models.Review

export default mongoose.model<IReview>('Review', ReviewSchema)
