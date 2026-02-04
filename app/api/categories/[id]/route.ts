import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Category from '@/models/Category'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const { id } = await params
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      )
    }
    
    const category = await Category.findById(id)
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(category)
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const { id } = await params
    const body = await request.json()
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      )
    }
    
    // If name is being updated, regenerate slug
    if (body.name) {
      const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      
      // Check if slug already exists (excluding current category)
      const existingCategory = await Category.findOne({ 
        slug, 
        _id: { $ne: id } 
      })
      
      if (existingCategory) {
        return NextResponse.json(
          { error: 'Category with this name already exists' },
          { status: 400 }
        )
      }
      
      body.slug = slug
    }
    
    const category = await Category.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    )
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const { id } = await params
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      )
    }
    
    // Check if category has products
    const Product = (await import('@/models/Product')).default
    const productCount = await Product.countDocuments({ categoryId: id })
    
    if (productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category. It has ${productCount} products associated with it.` },
        { status: 400 }
      )
    }
    
    const category = await Category.findByIdAndDelete(id)
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}