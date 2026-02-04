import mongoose from 'mongoose'

export interface IMpesaTransaction {
  _id?: string
  // M-Pesa STK Push transaction details
  merchantRequestID?: string
  checkoutRequestID?: string
  resultCode: number
  resultDesc: string
  
  // M-Pesa C2B transaction details
  transactionType?: string
  transactionId?: string
  businessShortCode?: string
  billRefNumber?: string
  invoiceNumber?: string
  orgAccountBalance?: number
  thirdPartyTransID?: string
  firstName?: string
  middleName?: string
  lastName?: string
  
  // Common transaction details
  mpesaReceiptNumber?: string
  transactionDate?: string
  phoneNumber: string
  amount: number
  
  // Order and payment info
  orderId?: mongoose.Types.ObjectId
  orderNumber?: string
  
  // Status tracking
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed'
  
  // M-Pesa response data
  responseCode?: string
  responseDescription?: string
  customerMessage?: string
  
  // Timestamps
  createdAt?: Date
  updatedAt?: Date
}

const MpesaTransactionSchema = new mongoose.Schema<IMpesaTransaction>({
  // STK Push fields
  merchantRequestID: {
    type: String,
    sparse: true // Not required for C2B transactions
  },
  checkoutRequestID: {
    type: String,
    sparse: true // Not required for C2B transactions
  },
  resultCode: {
    type: Number,
    required: true
  },
  resultDesc: {
    type: String,
    required: true
  },
  
  // C2B specific fields
  transactionType: String, // e.g., "Pay Bill", "Buy Goods"
  transactionId: String, // Alternative to mpesaReceiptNumber
  businessShortCode: String,
  billRefNumber: String, // Reference number provided by customer
  invoiceNumber: String,
  orgAccountBalance: Number,
  thirdPartyTransID: String,
  firstName: String,
  middleName: String,
  lastName: String,
  
  // Common fields
  mpesaReceiptNumber: {
    type: String,
    sparse: true // Allows multiple nulls but enforces uniqueness when present
  },
  transactionDate: String,
  phoneNumber: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    sparse: true
  },
  orderNumber: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  responseCode: String,
  responseDescription: String,
  customerMessage: String
}, {
  timestamps: true
})

// Indexes for better performance
// Note: checkoutRequestID, merchantRequestID, mpesaReceiptNumber already have sparse indexes due to field definitions
MpesaTransactionSchema.index({ transactionId: 1 }) // For C2B transactions
MpesaTransactionSchema.index({ billRefNumber: 1 }) // For C2B reference lookup
// Note: orderId is already indexed as part of compound indexes in other models
MpesaTransactionSchema.index({ phoneNumber: 1 })
MpesaTransactionSchema.index({ status: 1 })
MpesaTransactionSchema.index({ createdAt: -1 })

// Force delete the cached model to ensure we use the new schema
if (mongoose.models.MpesaTransaction) {
  delete mongoose.models.MpesaTransaction
}

export default mongoose.model<IMpesaTransaction>('MpesaTransaction', MpesaTransactionSchema)
