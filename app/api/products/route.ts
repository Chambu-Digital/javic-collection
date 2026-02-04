import { NextRequest, NextResponse } from 'next/server'
import { ensureDBConnection } from '@/lib/db-utils'
import Product from '@/models/Product'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    await ensureDBConnection()
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const categoryId = searchParams.get('categoryId')
    const featured = searchParams.get('featured')
    const flashDeals = searchParams.get('flashDeals')
    const catalog = searchParams.get('catalog') === 'true'
    const search = searchParams.get('search')
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const limit = parseInt(searchParams.get('limit') || '0')
    const page = parseInt(searchParams.get('page') || '1')
    const sort = searchParams.get('sort') || 'createdAt'
    const order = searchParams.get('order') || 'desc'
    
    // Build query - for admin, include inactive products
    let query: any = includeInactive ? {} : { isActive: true }
    
    // For catalog view, also filter out of stock products
    if (catalog) {
      query = {
        isActive: true,
        $or: [
          { inStock: true },
          { stockQuantity: { $gt: 0 } }
        ]
      }
    }
    
    // Filter by categoryId (preferred) or category name (fallback)
    if (categoryId) {
      // Ensure categoryId is a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(categoryId)) {
        query.categoryId = new mongoose.Types.ObjectId(categoryId)
      } else {
        console.error('Invalid categoryId provided:', categoryId)
        return NextResponse.json(
          { error: 'Invalid category ID format' },
          { status: 400 }
        )
      }
    } else if (category) {
      // Case-insensitive category name matching as fallback
      query.category = { $regex: new RegExp(`^${category}$`, 'i') }
    }
    
    if (featured === 'true') {
      query.isFeatured = true
    }
    
    if (flashDeals === 'true') {
      query.isFlashDeal = true
    }
    
    // Search functionality
    if (search) {
      query.$and = query.$and || []
      query.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      })
    }
    
    // Build sort object
    const sortObj: any = {}
    sortObj[sort] = order === 'desc' ? -1 : 1
    
    // Execute query
    let productsQuery = Product.find(query).sort(sortObj)
    
    if (limit > 0) {
      const skip = (page - 1) * limit
      productsQuery = productsQuery.skip(skip).limit(limit)
    }
    
    const products = await productsQuery.exec()
    
    // Get total count for pagination
    const total = await Product.countDocuments(query)
    
    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: limit > 0 ? Math.ceil(total / limit) : 1
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/products - Starting request processing')
    await connectDB()
    console.log('POST /api/products - Database connected successfully')
    
    const body = await request.json()
    console.log('POST /api/products - Request body received:', {
      name: body.name,
      category: body.category,
      hasVariants: body.hasVariants,
      variantsCount: body.variants?.length || 0
    })
    
    const { name, category, ...otherFields } = body
    
    if (!name || !category) {
      console.log('POST /api/products - Missing required fields:', { name: !!name, category: !!category })
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      )
    }
    
    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    console.log('POST /api/products - Generated slug:', slug)
    
    // Check if slug already exists
    const existingProduct = await Product.findOne({ slug })
    if (existingProduct) {
      console.log('POST /api/products - Product with slug already exists:', slug)
      return NextResponse.json(
        { error: 'Product with this name already exists' },
        { status: 400 }
      )
    }
    
    // Find category by name to get categoryId
    const Category = (await import('@/models/Category')).default
    console.log('POST /api/products - Looking for category:', category)
    const categoryDoc = await Category.findOne({ name: category })
    if (!categoryDoc) {
      console.log('POST /api/products - Category not found:', category)
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 400 }
      )
    }
    console.log('POST /api/products - Category found:', categoryDoc._id)
    
    // Debug logging
    console.log('Creating product with data:', {
      name,
      hasVariants: otherFields.hasVariants,
      variantsCount: otherFields.variants?.length || 0,
      variants: otherFields.variants
    })
    
    const productData = {
      name,
      slug,
      category,
      categoryId: categoryDoc._id,
      ...otherFields,
      isActive: true
    }
    
    console.log('POST /api/products - Final product data:', {
      ...productData,
      variants: productData.variants ? `${productData.variants.length} variants` : 'no variants'
    })
    
    const product = new Product(productData)
    console.log('POST /api/products - Product model created, attempting to save...')
    
    await product.save()
    console.log('POST /api/products - Product saved successfully with ID:', product._id)
    
    // Debug: Check what was actually saved
    const savedProduct = await Product.findById(product._id)
    console.log('Saved product variants:', {
      hasVariants: savedProduct?.hasVariants,
      variantsCount: savedProduct?.variants?.length || 0
    })
    
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('POST /api/products - Error creating product:', error)
    console.error('POST /api/products - Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: `Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}