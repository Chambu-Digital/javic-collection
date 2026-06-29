import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Campaign from '@/models/Campaign'
import { requireAdmin } from '@/lib/auth'

// Compute the correct status based on schedule dates
function computeStatus(
  currentStatus: string,
  startDate: Date,
  endDate?: Date
): string {
  if (currentStatus === 'disabled' || currentStatus === 'draft') return currentStatus
  const now = new Date()
  if (endDate && now > endDate) return 'expired'
  if (now >= startDate) return 'active'
  return 'scheduled'
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)
    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'))
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const skip = (page - 1) * limit

    const query: Record<string, unknown> = {}

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subtitle: { $regex: search, $options: 'i' } },
      ]
    }
    if (status && status !== 'all') query.status = status
    if (type && type !== 'all') query.type = type

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Campaign.countDocuments(query),
    ])

    // Sync status for any scheduled/active campaigns
    const now = new Date()
    const synced = campaigns.map((c: any) => {
      if (c.status !== 'disabled' && c.status !== 'draft') {
        const computed = computeStatus(c.status, c.schedule.startDate, c.schedule.endDate)
        if (computed !== c.status) {
          // Fire-and-forget status update
          Campaign.findByIdAndUpdate(c._id, { status: computed }).exec()
          return { ...c, status: computed }
        }
      }
      return c
    })

    return NextResponse.json({
      campaigns: synced,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('[campaigns GET]', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin(request)
    await connectDB()

    const body = await request.json()

    // Derive initial status from schedule
    const startDate = new Date(body.schedule?.startDate)
    const endDate = body.schedule?.endDate ? new Date(body.schedule.endDate) : undefined
    const derivedStatus = computeStatus(body.status || 'draft', startDate, endDate)

    const campaign = await Campaign.create({
      ...body,
      status: derivedStatus,
      createdBy: user.id,
      updatedBy: user.id,
    })

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('[campaigns POST]', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}
