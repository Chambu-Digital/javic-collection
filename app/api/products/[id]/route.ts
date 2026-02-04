import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const { id } = await params
    // Check if id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      )
    }
    
    const product = await Product.findById(id)
    
    if (!product) {
      // For debugging: let's see what products exist
      const allProducts = await Product.find({}).limit(5)
      console.log('Available product IDs:', allProducts.map(p => p._id.toString()))
      
      return NextResponse.json(
        { 
          error: 'Product not found',
          requestedId: id,
          availableIds: allProducts.map(p => p._id.toString())
        },
        { status: 404 }
      )
    }
    
    // Debug: Log what we're returning from database
    console.log('Raw product from database:', {
      id: product._id,
      name: product.name,
      hasVariants: product.hasVariants,
      variantsCount: product.variants?.length || 0,
      variants: product.variants,
      fullProduct: JSON.stringify(product, null, 2)
    })
    
    // Debug: Check if variants exist in raw document
    console.log('Product document keys:', Object.keys(product.toObject()))
    console.log('Variants field exists:', 'variants' in product.toObject())
    console.log('HasVariants field exists:', 'hasVariants' in product.toObject())
    
    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
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
        { error: 'Invalid product ID' },
        { status: 400 }
      )
    }
    
    // If name is being updated, regenerate slug
    if (body.name) {
      const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      
      // Check if slug already exists (excluding current product)
      const existingProduct = await Product.findOne({ 
        slug, 
        _id: { $ne: id } 
      })
      
      if (existingProduct) {
        return NextResponse.json(
          { error: 'Product with this name already exists' },
          { status: 400 }
        )
      }
      
      body.slug = slug
    }
    
    // If category is being updated, find categoryId
    if (body.category) {
      const Category = (await import('@/models/Category')).default
      const category = await Category.findOne({ name: body.category })
      if (category) {
        body.categoryId = category._id
      }
    }
    
    const product = await Product.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    )
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
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
        { error: 'Invalid product ID' },
        { status: 400 }
      )
    }
    
    const product = await Product.findByIdAndDelete(id)
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}