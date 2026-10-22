import { NextRequest, NextResponse } from 'next/server'
import { googleAdsService } from '@/lib/google-ads-service'
import { getCurrentUser } from '@/lib/auth'
import dbConnect from '@/lib/db'

export async function POST(
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

    const result = await googleAdsService.resumeCampaign(params.id)

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
    console.error('Resume campaign error:', error)
    return NextResponse.json(
      { error: 'Failed to resume campaign' },
      { status: 500 }
    )
  }
}
