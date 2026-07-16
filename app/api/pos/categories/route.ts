import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Category from '@/models/Category'
import { requirePosAuth, handlePosAuthError } from '@/lib/pos/auth'

export async function GET(request: NextRequest) {
  try {
    await requirePosAuth(request)
    await connectDB()
    const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean()
    return NextResponse.json({ categories })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
