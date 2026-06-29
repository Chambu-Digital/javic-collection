import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { CampaignAnalytics } from '@/models/Campaign'
import Campaign from '@/models/Campaign'
import mongoose from 'mongoose'

type EventType = 'view' | 'click' | 'dismiss'

// POST /api/campaigns/track — public, no auth required
// Body: { campaignId: string, event: 'view' | 'click' | 'dismiss', visitorId?: string }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignId, event, visitorId } = body as {
      campaignId: string
      event: EventType
      visitorId?: string
    }

    if (!campaignId || !event) {
      return NextResponse.json({ error: 'campaignId and event are required' }, { status: 400 })
    }

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return NextResponse.json({ error: 'Invalid campaignId' }, { status: 400 })
    }

    if (!['view', 'click', 'dismiss'].includes(event)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    await connectDB()

    // Verify campaign exists and is active
    const campaign = await Campaign.findById(campaignId).select('status').lean()
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Day-level bucket (UTC midnight)
    const now = new Date()
    const dayBucket = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

    // Map event to the field to increment
    const incrementField: Record<EventType, string> = {
      view: 'views',
      click: 'clicks',
      dismiss: 'dismissals',
    }

    const inc: Record<string, number> = { [incrementField[event]]: 1 }

    // Track unique visitor on view events using a rough hashed fingerprint
    if (event === 'view' && visitorId) {
      inc.uniqueVisitors = 1
    }

    await CampaignAnalytics.findOneAndUpdate(
      { campaignId: new mongoose.Types.ObjectId(campaignId), date: dayBucket },
      { $inc: inc },
      { upsert: true }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[campaigns/track POST]', error)
    // Return 200 even on error to avoid noisy client errors for analytics
    return NextResponse.json({ success: false })
  }
}
