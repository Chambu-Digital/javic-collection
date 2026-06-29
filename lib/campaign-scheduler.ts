import type { CampaignStatus } from '@/models/Campaign'

/**
 * Derives the correct campaign status from schedule dates.
 *
 * Rules:
 *   - 'disabled' and 'draft' statuses are always preserved unchanged.
 *   - If endDate exists and is in the past  → 'expired'
 *   - If startDate is now or in the past    → 'active'
 *   - If startDate is in the future         → 'scheduled'
 *
 * This function is a pure utility with no Next.js or browser dependencies so it
 * can be imported freely in API routes, server actions, and test files alike.
 */
export function computeStatus(
  currentStatus: CampaignStatus | string,
  startDate: Date,
  endDate?: Date
): CampaignStatus {
  if (currentStatus === 'disabled' || currentStatus === 'draft') {
    return currentStatus as CampaignStatus
  }

  const now = new Date()

  if (endDate && now > endDate) return 'expired'
  if (now >= startDate) return 'active'
  return 'scheduled'
}
