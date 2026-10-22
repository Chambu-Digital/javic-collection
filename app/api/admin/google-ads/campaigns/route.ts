import { NextRequest, NextResponse } from 'next/server'
import { googleAdsService } from '@/lib/google-ads-service'
import { getCurrentUser, requireAdmin } from '@/lib/auth'
import dbConnect from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    await dbConnect()
    await requireAdmin(req)

    const { searchParams } = new URL(req.url)
    const googleAccountId = searchParams.get('accountId')
    const status = searchParams.get('status')

    if (!googleAccountId) {
      return NextResponse.json(
        { error: 'Google Account ID required' },
        { status: 400 }
      )
    }

    const result = await googleAdsService.getCampaigns(googleAccountId, status || undefined)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      campaigns: result.campaigns
    })
  } catch (error) {
    console.error('Get campaigns error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
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
    const {
      name,
      description,
      campaignType,
      dailyBudget,
      totalBudget,
      keywords,
      negativeKeywords,
      landingPageUrl,
      adCopies,
      startDate,
      endDate
    } = body

    if (!name || !campaignType || !dailyBudget || !landingPageUrl || !adCopies) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await googleAdsService.createCampaign({
      name,
      description,
      campaignType,
      dailyBudget,
      totalBudget: totalBudget || dailyBudget * 30,
      keywords,
      negativeKeywords,
      landingPageUrl,
      adCopies,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      createdBy: user._id.toString()
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      campaignId: result.campaignId
    })
  } catch (error) {
    console.error('Create campaign error:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}
