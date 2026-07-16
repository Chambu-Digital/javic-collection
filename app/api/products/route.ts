import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    
    // Extract query parameters
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const flashDeals = searchParams.get('flashDeals') === 'true'
    const isFeatured = searchParams.get('featured') === 'true'
    const isBestseller = searchParams.get('bestseller') === 'true'
    const catalog = searchParams.get('catalog') === 'true'
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    // Build query
    let query: any = {}
    
    // Only show active products unless specifically requested
    if (!includeInactive) {
      query.isActive = true
    }

    // For special collection filters, also require the product to be in stock
    // so out-of-stock items never appear in flash deals, featured, or bestseller sections
    if (flashDeals || isFeatured || isBestseller) {
      query.inStock = true
      query.stockQuantity = { $gt: 0 }
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ]
    }
    
    // Category filter
    if (category) {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') }
    }
    
    // Flash deals filter
    if (flashDeals) {
      query.isFlashDeal = true
    }

    // Featured filter
    if (isFeatured) {
      query.isFeatured = true
    }

    // Bestseller filter
    if (isBestseller) {
      query.isBestseller = true
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit
    
    // Execute query
    let productsQuery = Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
    
    const products = await productsQuery.exec()
    
    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query)
    const totalPages = Math.ceil(totalProducts / limit)
    
    // Return response
    const response = {
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error: any) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    
    // Generate slug from name
    if (body.name) {
      const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      
      // Check if slug already exists
      const existingProduct = await Product.findOne({ slug })
      if (existingProduct) {
        return NextResponse.json(
          { error: 'Product with this name already exists' },
          { status: 400 }
        )
      }
      
      body.slug = slug
    }
    
    // Find categoryId if category name is provided
    if (body.category) {
      const category = await Category.findOne({ name: body.category })
      if (category) {
        body.categoryId = category._id
      }
    }
    
    // Create new product
    const product = new Product(body)
    await product.save()
    
    return NextResponse.json(product, { status: 201 })
    
  } catch (error: any) {
    console.error('Error creating product:', error)
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}