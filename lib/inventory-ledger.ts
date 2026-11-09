/**
 * Inventory movement ledger writer.
 *
 * The LedgerEntry model (models/LedgerEntry.ts) is the de-facto stock movement
 * log that the admin Stock Movements page reads, but until now nothing ever
 * wrote to it. This helper is the single funnel every stock-affecting operation
 * should pass through so the movement history is complete and consistent.
 *
 * It is safe to call inside a Mongoose transaction — pass the session and the
 * entry is created atomically with the rest of the operation.
 */

import mongoose from 'mongoose'
import LedgerEntry, { LedgerEventType } from '@/models/LedgerEntry'

export interface CreateLedgerEntryInput {
  eventType: LedgerEventType
  /** 'website' | 'pos' | 'admin' | 'system' — defaults to 'system' */
  source?: 'website' | 'pos' | 'admin' | 'system'
  channel?: 'online' | 'pos' | 'admin'
  branchId?: string | mongoose.Types.ObjectId
  branchCode?: string
  branchStockId?: string
  userId?: string | mongoose.Types.ObjectId
  userName?: string
  productId?: string | mongoose.Types.ObjectId
  productName?: string
  variantImageUrl?: string
  size?: string
  /** Quantity moved (positive for additions, we store direction in the type) */
  quantity?: number
  /** Stock before the movement */
  previousQty?: number
  /** Stock after the movement */
  newQty?: number
  referenceNumber?: string
  notes?: string
  metadata?: Record<string, unknown>
  session?: mongoose.ClientSession
}

let entryCounter = 0

/** Generate a unique-ish entry number. Combines timestamp + counter + random. */
function generateEntryNumber(): string {
  const date = new Date()
  const stamp =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0') +
    String(date.getHours()).padStart(2, '0') +
    String(date.getMinutes()).padStart(2, '0') +
    String(date.getSeconds()).padStart(2, '0')
  entryCounter = (entryCounter + 1) % 100000
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `INV-${stamp}-${String(entryCounter).padStart(5, '0')}-${rand}`
}

function toObjectId(value?: string | mongoose.Types.ObjectId): mongoose.Types.ObjectId | undefined {
  if (!value) return undefined
  if (value instanceof mongoose.Types.ObjectId) return value
  try {
    return new mongoose.Types.ObjectId(value)
  } catch {
    return undefined
  }
}

/**
 * Create and save a single LedgerEntry. Retries once on duplicate entryNumber.
 * Returns the created entry (lean-ish object) or null if it could not be saved.
 */
export async function createLedgerEntry(
  input: CreateLedgerEntryInput
): Promise<typeof LedgerEntry.prototype | null> {
  const session = input.session
  const baseDoc: any = {
    entryNumber: generateEntryNumber(),
    eventType: input.eventType,
    source: input.source || 'system',
    channel: input.channel,
    branchId: toObjectId(input.branchId),
    branchCode: input.branchCode,
    branchStockId: input.branchStockId,
    userId: toObjectId(input.userId),
    userName: input.userName,
    productId: toObjectId(input.productId),
    productName: input.productName,
    variantImageUrl: input.variantImageUrl,
    size: input.size,
    quantity: input.quantity,
    // totalMinor is required by the schema; inventory movements carry the
    // quantity on the `quantity` field, so we record 0 for the money column.
    totalMinor: 0,
    referenceNumber: input.referenceNumber,
    notes: input.notes,
    previousValue: input.previousQty !== undefined ? String(input.previousQty) : undefined,
    newValue: input.newQty !== undefined ? String(input.newQty) : undefined,
    wasOffline: false,
    syncStatus: 'synced',
    isReversal: false,
    metadata: input.metadata,
  }

  // Strip undefined keys so Mongoose defaults apply cleanly
  Object.keys(baseDoc).forEach((k) => baseDoc[k] === undefined && delete baseDoc[k])

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const entry = new LedgerEntry(baseDoc)
      await entry.save({ session: session || undefined })
      return entry
    } catch (err: any) {
      // Retry once on a duplicate entryNumber collision
      if (attempt === 0 && err?.code === 11000 && /entryNumber/i.test(err?.message || '')) {
        baseDoc.entryNumber = generateEntryNumber()
        continue
      }
      // Non-fatal: never let movement logging break a stock transaction.
      console.error('createLedgerEntry failed:', err)
      return null
    }
  }
  return null
}

/**
 * Convenience: record a stock movement (add/remove/adjust/transfer) with the
 * previous and new quantities captured explicitly. Used by stock-in, stock-out,
 * stock count, transfers and the manual add/remove routes.
 */
export interface StockMovementContext {
  branchId?: string | mongoose.Types.ObjectId
  branchCode?: string
  branchStockId?: string
  userId?: string | mongoose.Types.ObjectId
  userName?: string
  productId?: string | mongoose.Types.ObjectId
  productName?: string
  variantImageUrl?: string
  size?: string
  referenceNumber?: string
  notes?: string
  metadata?: Record<string, unknown>
  session?: mongoose.ClientSession
}

export async function recordStockMovement(
  eventType: LedgerEventType,
  source: 'website' | 'pos' | 'admin' | 'system',
  quantity: number,
  previousQty: number,
  newQty: number,
  ctx: StockMovementContext
) {
  return createLedgerEntry({
    eventType,
    source,
    quantity,
    previousQty,
    newQty,
    ...ctx,
  })
}
