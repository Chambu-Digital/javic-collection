import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IAddress {
  _id?: string
  type: 'shipping' | 'billing'
  name: string // Full name (simplified from firstName + lastName)
  phone: string // Required for M-Pesa and delivery
  county: string
  area: string
  isDefault: boolean
}

export interface IUser {
  _id?: string
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
  dateOfBirth?: Date
  addresses: IAddress[]
  isEmailVerified: boolean
  emailVerificationToken?: string
  passwordResetToken?: string
  passwordResetExpires?: Date
  isActive: boolean
  role: 'customer' | 'admin' | 'super_admin'
  permissions?: string[] // New granular permissions system
  // Google OAuth fields
  googleId?: string
  profileImage?: string
  provider: 'local' | 'google'
  legacyPermissions?: {
    products?: {
      view?: boolean
      create?: boolean
      edit?: boolean
      delete?: boolean
    }
    orders?: {
      view?: boolean
      edit?: boolean
      cancel?: boolean
    }
    blog?: {
      view?: boolean
      create?: boolean
      edit?: boolean
      delete?: boolean
    }
    customers?: {
      view?: boolean
      edit?: boolean
    }
    reports?: {
      view?: boolean
      export?: boolean
    }
    settings?: {
      view?: boolean
      edit?: boolean
    }
    locations?: {
      view?: boolean
      edit?: boolean
    }
  }
  isApproved: boolean
  approvedBy?: mongoose.Types.ObjectId
  approvedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

const AddressSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['shipping', 'billing']
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  county: {
    type: String,
    required: true,
    trim: true
  },
  area: {
    type: String,
    required: true,
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

const UserSchema = new mongoose.Schema<IUser>({
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
    required: function() {
      return this.provider === 'local'
    },
    minlength: 6
  },
  phone: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  addresses: [AddressSchema],
  isEmailVerified: {
    type: Boolean,
    default: function() {
      return this.provider === 'google' // Google users are pre-verified
    }
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['customer', 'admin', 'super_admin'],
    default: 'customer'
  },
  permissions: [{
    type: String,
    trim: true
  }],
  // Google OAuth fields
  googleId: {
    type: String,
    sparse: true // Allows null values but ensures uniqueness when present
  },
  profileImage: {
    type: String
  },
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  legacyPermissions: {
    products: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    orders: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      cancel: { type: Boolean, default: false }
    },
    blog: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    customers: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    },
    reports: {
      view: { type: Boolean, default: false },
      export: { type: Boolean, default: false }
    },
    settings: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    },
    locations: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    }
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Hash password before saving
// Note: This only runs if the password field has been modified
// When creating users from AdminRequest (which already has hashed passwords),
// use markModified('password', false) to prevent double hashing
UserSchema.pre('save', async function(next) {
  // Skip password hashing for Google OAuth users
  if (this.provider === 'google' || !this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error: any) {
    next(error)
  }
})

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  // Google OAuth users don't have passwords to compare
  if (this.provider === 'google') return false
  return bcrypt.compare(candidatePassword, this.password)
}

// Ensure only one default address per type
UserSchema.pre('save', function(next) {
  if (this.isModified('addresses')) {
    const shippingDefaults = this.addresses.filter(addr => addr.type === 'shipping' && addr.isDefault)
    const billingDefaults = this.addresses.filter(addr => addr.type === 'billing' && addr.isDefault)
    
    // If multiple defaults, keep only the first one
    if (shippingDefaults.length > 1) {
      this.addresses.forEach((addr, index) => {
        if (addr.type === 'shipping' && addr.isDefault && index > 0) {
          addr.isDefault = false
        }
      })
    }
    
    if (billingDefaults.length > 1) {
      this.addresses.forEach((addr, index) => {
        if (addr.type === 'billing' && addr.isDefault && index > 0) {
          addr.isDefault = false
        }
      })
    }
  }
  next()
})

// Index for better performance
// Note: email and googleId already have indexes due to unique: true
UserSchema.index({ isActive: 1 })

// Force delete the cached model to ensure we use the new schema
if (mongoose.models.User) {
  delete mongoose.models.User
}

export default mongoose.model<IUser>('User', UserSchema)