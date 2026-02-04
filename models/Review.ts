import mongoose from 'mongoose'

export interface IReview {
  _id?: string
  productId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  orderId: mongoose.Types.ObjectId
  orderItemId: string
  
  // Review content
  rating: number // 1-5 stars
  title: string
  comment: string
  images?: string[] // Optional review images
  
  // Customer info (for display)
  customerName: string
  customerEmail: string
  
  // Verification
  isVerifiedPurchase: boolean
  
  // Moderation
  status: 'pending' | 'approved' | 'rejected'
  moderatedBy?: mongoose.Types.ObjectId
  moderatedAt?: Date
  moderationNotes?: string
  
  // Helpful votes
  helpfulVotes: number
  totalVotes: number
  
  // Timestamps
  createdAt?: Date
  updatedAt?: Date
}

const ReviewSchema = new mongoose.Schema<IReview>({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  orderItemId: {
    type: String,
    required: true
  },
  
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  images: [{
    type: String
  }],
  
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    required: true,
    lowercase: true
  },
  
  isVerifiedPurchase: {
    type: Boolean,
    default: true
  },
  
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: Date,
  moderationNotes: {
    type: String,
    maxlength: 500
  },
  
  helpfulVotes: {
    type: Number,
    default: 0,
    min: 0
  },
  totalVotes: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
})

// Compound index to prevent duplicate reviews for same product by same user in same order
ReviewSchema.index({ 
  productId: 1, 
  userId: 1, 
  orderId: 1, 
  orderItemId: 1 
}, { unique: true })

// Indexes for queries
ReviewSchema.index({ productId: 1, status: 1, createdAt: -1 })
ReviewSchema.index({ userId: 1, createdAt: -1 })
ReviewSchema.index({ status: 1, createdAt: -1 })
ReviewSchema.index({ rating: 1 })

// Force delete the cached model to ensure we use the new schema
if (mongoose.models.Review) {
  delete mongoose.models.Review
}

export default mongoose.model<IReview>('Review', ReviewSchema)