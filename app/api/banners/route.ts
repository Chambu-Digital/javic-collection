import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Banner from '@/models/Banner'

export async function GET() {
  try {
    await connectDB()
    const banners = await Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 })
    return NextResponse.json(banners)
  } catch (error) {
    console.error('Error fetching active banners:', error)
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 })
  }
}
