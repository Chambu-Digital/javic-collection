import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { CampaignAnalytics } from '@/models/Campaign'
import { requireAdmin } from '@/lib/auth'
import mongoose from 'mongoose'

// GET /api/admin/campaigns/[id]/analytics — daily breakdown for charts
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

    const { searchParams } = new URL(request.url)
    const days = Math.min(90, parseInt(searchParams.get('days') || '30'))
    const since = new Date()
    since.setDate(since.getDate() - days)

    const rows = await CampaignAnalytics.find({
      campaignId: new mongoose.Types.ObjectId(id),
      date: { $gte: since },
    })
      .sort({ date: 1 })
      .lean()

    // Aggregate totals
    const totals = rows.reduce(
      (acc, r) => {
        acc.totalViews += r.views
        acc.totalClicks += r.clicks
        acc.totalDismissals += r.dismissals
        acc.totalUniqueVisitors += r.uniqueVisitors
        return acc
      },
      { totalViews: 0, totalClicks: 0, totalDismissals: 0, totalUniqueVisitors: 0 }
    )

    const ctr =
      totals.totalViews > 0
        ? parseFloat(((totals.totalClicks / totals.totalViews) * 100).toFixed(2))
        : 0

    return NextResponse.json({ rows, totals: { ...totals, ctr } })
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('[campaigns/:id/analytics GET]', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
