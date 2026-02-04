import { NextRequest, NextResponse } from 'next/server'
import { ensureDBConnection } from '@/lib/db-utils'
import Category from '@/models/Category'

export async function GET(request: NextRequest) {
  try {
    await ensureDBConnection()
    
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    
    // For admin panel, include inactive. For frontend, only active
    const query = includeInactive ? {} : { isActive: true }
    const categories = await Category.find(query).sort({ name: 1 })
    
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const data = await request.json()
    
    const category = new Category(data)
    await category.save()
    
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}