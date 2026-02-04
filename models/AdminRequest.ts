import mongoose from 'mongoose'

export interface IAdminRequest {
  _id?: string
  firstName: string
  lastName: string
  email: string
  password: string // Hashed
  status: 'pending' | 'approved' | 'rejected'
  requestedAt?: Date
  reviewedAt?: Date
  reviewedBy?: mongoose.Types.ObjectId // Super admin who reviewed
  rejectionReason?: string
  createdAt?: Date
  updatedAt?: Date
}

const AdminRequestSchema = new mongoose.Schema<IAdminRequest>({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
})

// Index for better performance
// Note: email already has an index due to unique: true
AdminRequestSchema.index({ status: 1 })
AdminRequestSchema.index({ requestedAt: -1 })

// Force delete the cached model to ensure we use the new schema
if (mongoose.models.AdminRequest) {
  delete mongoose.models.AdminRequest
}

export default mongoose.model<IAdminRequest>('AdminRequest', AdminRequestSchema)