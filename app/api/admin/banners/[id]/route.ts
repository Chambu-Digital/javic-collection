import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Banner from '@/models/Banner'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    
    if (!resolvedParams?.id) {
      return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 })
    }
    
    await connectDB()
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json({ error: 'Invalid banner ID format' }, { status: 400 })
    }
    
    const banner = await Banner.findById(resolvedParams.id)
    
    if (!banner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }
    
    return NextResponse.json(banner)
  } catch (error) {
    console.error('Error fetching banner:', error)
    return NextResponse.json({ error: 'Failed to fetch banner' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    await connectDB()
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json({ error: 'Invalid banner ID format' }, { status: 400 })
    }
    
    const body = await request.json()
    
    const banner = await Banner.findByIdAndUpdate(
      resolvedParams.id,
      body,
      { new: true, runValidators: true }
    )
    
    if (!banner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }
    
    return NextResponse.json(banner)
  } catch (error) {
    console.error('Error updating banner:', error)
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    await connectDB()
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json({ error: 'Invalid banner ID format' }, { status: 400 })
    }
    
    const banner = await Banner.findByIdAndDelete(resolvedParams.id)
    
    if (!banner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Banner deleted successfully' })
  } catch (error) {
    console.error('Error deleting banner:', error)
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 })
  }
}