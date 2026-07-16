import mongoose from 'mongoose'

export interface ICreditAccount {
  customerId: mongoose.Types.ObjectId
  customerName: string
  customerPhone?: string
  creditEnabled: boolean
  creditLimit: number
  outstandingBalance: number
  availableCredit: number
  creditStatus: 'active' | 'suspended' | 'blocked' | 'closed'
  lastTransactionDate?: Date
  createdAt: Date
  updatedAt: Date
  createdBy?: mongoose.Types.ObjectId
  outlet?: string
}

const CreditAccountSchema = new mongoose.Schema<ICreditAccount>({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String
  },
  creditEnabled: {
    type: Boolean,
    default: false
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: 0
  },
  outstandingBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  availableCredit: {
    type: Number,
    default: 0,
    min: 0
  },
  creditStatus: {
    type: String,
    enum: ['active', 'suspended', 'blocked', 'closed'],
    default: 'active'
  },
  lastTransactionDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  outlet: {
    type: String
  }
})

// Update available credit when outstanding balance changes
CreditAccountSchema.pre('save', function(next) {
  this.availableCredit = Math.max(0, this.creditLimit - this.outstandingBalance)
  this.updatedAt = new Date()
  next()
})

// Index for quick lookups
CreditAccountSchema.index({ customerId: 1 })
CreditAccountSchema.index({ customerPhone: 1 })
CreditAccountSchema.index({ creditStatus: 1 })

const CreditAccount = mongoose.models.CreditAccount || mongoose.model<ICreditAccount>('CreditAccount', CreditAccountSchema)

export default CreditAccount
