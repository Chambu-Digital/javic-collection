import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import SiteSettings from '@/models/SiteSettings'
import { requireAdmin } from '@/lib/auth'

// GET — fetch current settings (or defaults if none exist yet)
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    let settings = await SiteSettings.findOne({})
    if (!settings) {
      // Return defaults without saving — only save when admin explicitly saves
      settings = {
        watermarkEnabled: true,
        watermarkText: '',
        watermarkPosition: 'bottom-right',
        watermarkOpacity: 0.7,
      }
    }
    return NextResponse.json(settings)
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PUT — update settings
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request)
    await connectDB()

    const body = await request.json()
    const { watermarkEnabled, watermarkText, watermarkPosition, watermarkOpacity } = body

    // Upsert — create if doesn't exist, update if it does
    const settings = await SiteSettings.findOneAndUpdate(
      {},
      { watermarkEnabled, watermarkText, watermarkPosition, watermarkOpacity },
      { upsert: true, new: true, runValidators: true }
    )

    return NextResponse.json(settings)
  } catch (error: any) {
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
