import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Banner from '@/models/Banner'

export async function GET() {
  try {
    await connectDB()
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 })
    return NextResponse.json(banners)
  } catch (error) {
    console.error('Error fetching banners:', error)
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    
    const banner = new Banner(body)
    await banner.save()
    
    return NextResponse.json(banner, { status: 201 })
  } catch (error) {
    console.error('Error creating banner:', error)
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await connectDB()
    await Banner.deleteMany({})
    return NextResponse.json({ message: 'All banners deleted successfully' })
  } catch (error) {
    console.error('Error deleting banners:', error)
    return NextResponse.json({ error: 'Failed to delete banners' }, { status: 500 })
  }
}
