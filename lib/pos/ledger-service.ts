import mongoose from 'mongoose'
import LedgerEntry, { ILedgerEntry, LedgerEventType } from '@/models/LedgerEntry'

export interface CreateLedgerInput {
  eventType: LedgerEventType
  source: ILedgerEntry['source']
  channel?: ILedgerEntry['channel']
  outletId?: string
  outletName?: string
  userId?: string
  userName?: string
  customerId?: string
  customerName?: string
  orderId?: string
  orderNumber?: string
  productId?: string
  productName?: string
  variantImageUrl?: string
  size?: string
  quantity?: number
  debitMinor?: number
  creditMinor?: number
  totalMinor: number
  paymentMethod?: string
  paymentBreakdown?: Array<{ method: string; amountMinor: number; reference?: string }>
  referenceNumber?: string
  notes?: string
  previousValue?: string
  newValue?: string
  deviceId?: string
  wasOffline?: boolean
  reversalOf?: string
  isReversal?: boolean
  metadata?: Record<string, unknown>
  session?: mongoose.ClientSession
}

export async function createLedgerEntry(input: CreateLedgerInput): Promise<ILedgerEntry> {
  // Generate entryNumber here in application code rather than in a pre('save')
  // hook.  Mongoose hooks that issue their own DB query do not participate in
  // the parent transaction, which causes the hook to silently fail to set the
  // field and the required validator to reject the document.
  const date  = new Date()
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, '')

  // Use crypto.randomUUID's last 8 hex chars to guarantee uniqueness within
  // the same millisecond across concurrent sales without a DB round-trip.
  const unique = Math.random().toString(36).slice(2, 7).toUpperCase()
  const entryNumber = `LED${stamp}-${unique}`

  const entry = new LedgerEntry({
    entryNumber,
    eventType: input.eventType,
    source: input.source,
    channel: input.channel,
    outletId: input.outletId,
    outletName: input.outletName,
    userId: input.userId,
    userName: input.userName,
    customerId: input.customerId,
    customerName: input.customerName,
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    productId: input.productId,
    productName: input.productName,
    variantImageUrl: input.variantImageUrl,
    size: input.size,
    quantity: input.quantity,
    debitMinor: input.debitMinor,
    creditMinor: input.creditMinor,
    totalMinor: input.totalMinor,
    paymentMethod: input.paymentMethod,
    paymentBreakdown: input.paymentBreakdown,
    referenceNumber: input.referenceNumber,
    notes: input.notes,
    previousValue: input.previousValue,
    newValue: input.newValue,
    deviceId: input.deviceId,
    wasOffline: input.wasOffline || false,
    syncStatus: input.wasOffline ? 'pending' : 'synced',
    reversalOf: input.reversalOf,
    isReversal: input.isReversal || false,
    metadata: input.metadata,
  })

  if (input.session) {
    await entry.save({ session: input.session })
  } else {
    await entry.save()
  }

  return entry.toObject()
}

export interface LedgerFilters {
  startDate?: Date
  endDate?: Date
  channel?: string
  outletId?: string
  cashierId?: string
  customerId?: string
  eventType?: string
  paymentMethod?: string
  search?: string
  page?: number
  limit?: number
}

export async function queryLedger(filters: LedgerFilters) {
  const query: Record<string, unknown> = {}

  if (filters.startDate || filters.endDate) {
    query.createdAt = {}
    if (filters.startDate) (query.createdAt as any).$gte = filters.startDate
    if (filters.endDate) (query.createdAt as any).$lte = filters.endDate
  }
  if (filters.channel) query.channel = filters.channel
  if (filters.outletId) query.outletId = filters.outletId
  if (filters.cashierId) query.userId = filters.cashierId
  if (filters.customerId) query.customerId = filters.customerId
  if (filters.eventType) query.eventType = filters.eventType
  if (filters.paymentMethod) query.paymentMethod = filters.paymentMethod

  if (filters.search) {
    query.$or = [
      { orderNumber: { $regex: filters.search, $options: 'i' } },
      { customerName: { $regex: filters.search, $options: 'i' } },
      { referenceNumber: { $regex: filters.search, $options: 'i' } },
      { entryNumber: { $regex: filters.search, $options: 'i' } },
      { productName: { $regex: filters.search, $options: 'i' } },
    ]
  }

  const page = filters.page || 1
  const limit = filters.limit || 50
  const skip = (page - 1) * limit

  const [entries, total] = await Promise.all([
    LedgerEntry.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    LedgerEntry.countDocuments(query),
  ])

  return { entries, total, page, totalPages: Math.ceil(total / limit) }
}

export async function getLedgerSummaries(filters: LedgerFilters) {
  const query: Record<string, unknown> = {}
  if (filters.startDate || filters.endDate) {
    query.createdAt = {}
    if (filters.startDate) (query.createdAt as any).$gte = filters.startDate
    if (filters.endDate) (query.createdAt as any).$lte = filters.endDate
  }
  if (filters.outletId) query.outletId = filters.outletId

  const entries = await LedgerEntry.find(query).lean()

  const summaries = {
    posSalesMinor: 0,
    onlineSalesMinor: 0,
    cashCollectedMinor: 0,
    mpesaCollectedMinor: 0,
    creditIssuedMinor: 0,
    discountsMinor: 0,
    returnsMinor: 0,
    offlineTransactions: 0,
    syncConflicts: 0,
  }

  const countedOrders = new Set<string>()

  for (const e of entries) {
    if (e.wasOffline) summaries.offlineTransactions++
    if (e.syncStatus === 'conflict') summaries.syncConflicts++

    if (['pos_sale', 'wholesale_sale', 'retail_sale'].includes(e.eventType)) {
      if (e.orderNumber && !countedOrders.has(e.orderNumber)) {
        countedOrders.add(e.orderNumber)
        if (e.channel === 'pos') summaries.posSalesMinor += e.totalMinor
        else summaries.onlineSalesMinor += e.totalMinor
      }
    }
    if (e.eventType === 'cash_payment') summaries.cashCollectedMinor += e.totalMinor
    if (e.eventType === 'mpesa_payment') summaries.mpesaCollectedMinor += e.totalMinor
    if (e.eventType === 'credit_issued') summaries.creditIssuedMinor += e.totalMinor
    if (e.eventType === 'discount_applied') summaries.discountsMinor += e.totalMinor
    if (e.eventType === 'return' || e.eventType === 'refund') summaries.returnsMinor += e.totalMinor
  }

  return summaries
}
