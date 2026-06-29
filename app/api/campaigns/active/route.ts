import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Campaign from '@/models/Campaign'

// GET /api/campaigns/active — public endpoint, no auth required
// Returns only campaigns that are currently active and within schedule.
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const now = new Date()

    const campaigns = await Campaign.find({
      status: 'active',
      'schedule.startDate': { $lte: now },
      $or: [
        { 'schedule.endDate': { $exists: false } },
        { 'schedule.endDate': null },
        { 'schedule.endDate': { $gte: now } },
      ],
    })
      .sort({ priority: -1, createdAt: -1 })
      .lean()

    // Strip internal fields not needed on the public site
    const safe = campaigns.map((c: any) => ({
      _id: c._id,
      title: c.title,
      subtitle: c.subtitle,
      description: c.description,
      type: c.type,
      images: c.images,
      badge: c.badge,
      cta: c.cta,
      schedule: c.schedule,
      display: c.display,
      visibility: c.visibility,
      audience: c.audience,
      countdown: c.countdown,
      coupon: c.coupon,
      priority: c.priority,
    }))

    return NextResponse.json(
      { campaigns: safe },
      {
        headers: {
          // Cache for 60 s at the edge; revalidate in background
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    )
  } catch (error) {
    console.error('[campaigns/active GET]', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}
