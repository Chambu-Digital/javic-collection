import { NextRequest, NextResponse } from 'next/server'
import { googleAdsService } from '@/lib/google-ads-service'
import { getCurrentUser } from '@/lib/auth'
import dbConnect from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    
    const user = await getCurrentUser(req)
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const dateRange = searchParams.get('dateRange') // e.g., "7days", "30days", "all"

    const result = await googleAdsService.getCampaignMetrics(params.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      metrics: result.metrics
    })
  } catch (error) {
    console.error('Get campaign metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    
    const user = await getCurrentUser(req)
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body = await req.json()

    const result = await googleAdsService.updateCampaign(params.id, body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      campaign: result.campaign
    })
  } catch (error) {
    console.error('Update campaign error:', error)
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    )
  }
}
