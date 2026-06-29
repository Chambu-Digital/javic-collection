import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Campaign from '@/models/Campaign'
import { CampaignAnalytics } from '@/models/Campaign'
import { requireAdmin } from '@/lib/auth'
import mongoose from 'mongoose'

function computeStatus(currentStatus: string, startDate: Date, endDate?: Date): string {
  if (currentStatus === 'disabled' || currentStatus === 'draft') return currentStatus
  const now = new Date()
  if (endDate && now > endDate) return 'expired'
  if (now >= startDate) return 'active'
  return 'scheduled'
}

// GET /api/admin/campaigns/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    await connectDB()

    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 })
    }

    const campaign = await Campaign.findById(id).lean()
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Fetch aggregated analytics
    const analytics = await CampaignAnalytics.aggregate([
      { $match: { campaignId: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
          totalClicks: { $sum: '$clicks' },
          totalDismissals: { $sum: '$dismissals' },
          totalUniqueVisitors: { $sum: '$uniqueVisitors' },
        },
      },
    ])

    const stats = analytics[0] || {
      totalViews: 0,
      totalClicks: 0,
      totalDismissals: 0,
      totalUniqueVisitors: 0,
    }

    return NextResponse.json({ campaign, analytics: stats })
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('[campaigns/:id GET]', error)
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 })
  }
}

// PATCH /api/admin/campaigns/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin(request)
    await connectDB()

    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 })
    }

    const body = await request.json()

    // If schedule is being updated or status is not forced, recompute status
    let status = body.status
    if (body.schedule?.startDate && status !== 'disabled' && status !== 'draft') {
      const startDate = new Date(body.schedule.startDate)
      const endDate = body.schedule?.endDate ? new Date(body.schedule.endDate) : undefined
      status = computeStatus(status || 'draft', startDate, endDate)
    }

    const campaign = await Campaign.findByIdAndUpdate(
      id,
      { ...body, status, updatedBy: user.id },
      { new: true, runValidators: true }
    ).lean()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json({ campaign })
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('[campaigns/:id PATCH]', error)
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
  }
}

// DELETE /api/admin/campaigns/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    await connectDB()

    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 })
    }

    const campaign = await Campaign.findByIdAndDelete(id)
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Clean up analytics records
    await CampaignAnalytics.deleteMany({ campaignId: new mongoose.Types.ObjectId(id) })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('[campaigns/:id DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
  }
}
