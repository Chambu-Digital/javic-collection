import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import Branch from '@/models/Branch'
import BranchStock from '@/models/BranchStock'
import mongoose from 'mongoose'

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
    
    // Validate branch selection
    if (!body.branchId) {
      return NextResponse.json(
        { error: 'Branch selection is required' },
        { status: 400 }
      )
    }
    
    // Validate vendor selection
    if (!body.vendorId) {
      return NextResponse.json(
        { error: 'Vendor selection is required' },
        { status: 400 }
      )
    }
    
    // Verify branch exists and is active
    const branch = await Branch.findById(body.branchId)
    if (!branch || !branch.isActive) {
      return NextResponse.json(
        { error: 'Invalid or inactive branch selected' },
        { status: 400 }
      )
    }
    
    // Verify vendor exists and is active
    const Vendor = (await import('@/models/Vendor')).default
    const vendor = await Vendor.findById(body.vendorId)
    if (!vendor || !vendor.isActive) {
      return NextResponse.json(
        { error: 'Invalid or inactive vendor selected' },
        { status: 400 }
      )
    }
    
    // Create product and branch stock in a transaction
    const session = await mongoose.startSession()
    
    try {
      await session.withTransaction(async () => {
        // Create product
        const product = new Product(body)
        await product.save({ session })
        
        // Create BranchStock records for the selected branch and vendor
        const productSku = body.sku || `PROD${product._id.toString().slice(-6)}`
        
        // Handle per-image stock and per-size stock
        if (body.images && body.images.length > 0) {
          for (let imageIndex = 0; imageIndex < body.images.length; imageIndex++) {
            const image = body.images[imageIndex]
            const imageSku = image.sku || productSku
            
            // Handle size-specific stock
            if (image.sizeStock && typeof image.sizeStock === 'object') {
              const sizeStockMap = image.sizeStock as Record<string, number>
              for (const [size, quantity] of Object.entries(sizeStockMap)) {
                if (quantity > 0) {
                  const stockIdentifier = (BranchStock as any).generateStockIdentifier(
                    imageSku,
                    branch.branchCode,
                    imageIndex,
                    size
                  )
                  
                  const branchStock = new BranchStock({
                    productId: product._id,
                    branchId: branch._id,
                    vendorId: body.vendorId,
                    imageIndex,
                    selectedSize: size,
                    stockIdentifier,
                    quantity
                  })
                  
                  await branchStock.save({ session })
                }
              }
            } 
            // Handle image-level stock without size breakdown
            else if (image.stock !== undefined && image.stock > 0) {
              const stockIdentifier = (BranchStock as any).generateStockIdentifier(
                imageSku,
                branch.branchCode,
                imageIndex
              )
              
              const branchStock = new BranchStock({
                productId: product._id,
                branchId: branch._id,
                vendorId: body.vendorId,
                imageIndex,
                stockIdentifier,
                quantity: image.stock
              })
              
              await branchStock.save({ session })
            }
          }
        }
        
        // If product has overall stockQuantity but no image-level stock, create a default record
        // Use initialStock if provided, otherwise fall back to stockQuantity
        const initialStock = body.initialStock || body.stockQuantity || 0
        if (initialStock > 0) {
          const hasImageStock = body.images && body.images.some(img => 
            (img.stock && img.stock > 0) || 
            (img.sizeStock && Object.keys(img.sizeStock).length > 0)
          )
          
          if (!hasImageStock) {
            const stockIdentifier = (BranchStock as any).generateStockIdentifier(
              productSku,
              branch.branchCode,
              0
            )
            
            const branchStock = new BranchStock({
              productId: product._id,
              branchId: branch._id,
              imageIndex: 0,
              stockIdentifier,
              quantity: initialStock
            })
            
            await branchStock.save({ session })
          }
        }
      })
      
      // Fetch the created product to return
      const product = await Product.findOne({ slug: body.slug })
      return NextResponse.json(product, { status: 201 })
      
    } catch (transactionError) {
      await session.abortTransaction()
      throw transactionError
    } finally {
      session.endSession()
    }
    
  } catch (error: any) {
    console.error('Error creating product:', error)
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    )
  }
}