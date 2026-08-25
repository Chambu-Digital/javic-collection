import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import { requirePosAuth, handlePosAuthError } from '@/lib/pos/auth'
import { getProductSearchStock, isProductAvailable, getAllVariants } from '@/lib/pos/product-pricing'
import { getProductBranchStocks } from '@/lib/branch-inventory'

// Force dynamic — never cache this route so stock counts are always live
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    await requirePosAuth(request)
    await connectDB()

    const { searchParams } = new URL(request.url)
    const search   = searchParams.get('search')?.trim()
    const category = searchParams.get('category')
    const barcode  = searchParams.get('barcode')?.trim()
    const branchId = searchParams.get('branchId')?.trim() // NEW: Branch filter
    const page     = Math.max(1, parseInt(searchParams.get('page')  || '1'))
    const limit    = Math.min(96, Math.max(1, parseInt(searchParams.get('limit') || '48')))
    const skip     = (page - 1) * limit

    // Base filter — always only active products
    const query: Record<string, unknown> = { isActive: true }

    // Category filter
    if (category && category !== 'all') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') }
    }

    // Barcode lookup — exact match on SKU or slug
    if (barcode) {
      query.$or = [
        { 'images.sku': barcode },
        { slug: barcode },
      ]
    } else if (search) {
      // Full text search across name, slug, category, tags, and per-image SKU
      query.$or = [
        { name:        { $regex: search, $options: 'i' } },
        { slug:        { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category:    { $regex: search, $options: 'i' } },
        { tags:        { $regex: search, $options: 'i' } },
        { 'images.sku': { $regex: search, $options: 'i' } },
      ]
    }

    const [products, total] = await Promise.all([
      Product.find(query).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(query),
    ])

    // Fetch branch stock for all products in batch to avoid N+1 queries
    const productIds = products.map(p => p._id)
    const branchStocksMap = new Map<string, any[]>()
    
    // Batch fetch branch stocks for all products
    if (productIds.length > 0) {
      const branchStocksPromises = productIds.map(productId => 
        getProductBranchStocks(productId as any).catch(() => [])
      )
      
      const branchStocksResults = await Promise.all(branchStocksPromises)
      branchStocksResults.forEach((stocks, index) => {
        branchStocksMap.set(productIds[index].toString(), stocks)
      })
    }

    const enriched = products.map(p => {
      const stock = getProductSearchStock(p as any)
      const productId = p._id.toString()
      const branchStocks = branchStocksMap.get(productId) || []
      
      // NEW: Filter by branch if branchId is provided
      const relevantStocks = branchId 
        ? branchStocks.filter(bs => bs.branchId === branchId)
        : branchStocks
      
      // Calculate stock for selected branch only (or total if no branch filter)
      const branchSpecificStock = relevantStocks.reduce((sum, bs) => sum + bs.quantity, 0)
      
      // Group by vendor for multi-vendor display
      const vendorStocks = relevantStocks.map(bs => ({
        vendorId: bs.vendorId,
        vendorCode: bs.vendorCode,
        vendorName: bs.vendorName,
        quantity: bs.quantity
      }))
      
      // CRITICAL FIX: Enrich image-level stock from BranchStock records
      // Group branch stocks by imageIndex to calculate per-image stock
      const imageStockMap = new Map<number, number>()
      for (const bs of relevantStocks) {
        const currentStock = imageStockMap.get(bs.imageIndex) || 0
        imageStockMap.set(bs.imageIndex, currentStock + bs.quantity)
      }
      
      // Clone images array and enrich each image with its branch-specific stock
      const enrichedImages = (p.images || []).map((img: any, idx: number) => ({
        ...img,
        stock: imageStockMap.get(idx) || 0, // Set stock from branch records
      }))
      
      return {
        ...p,
        images: enrichedImages, // Use enriched images with branch-specific stock
        stock: branchSpecificStock, // Branch-specific stock (not total across all branches)
        available: branchSpecificStock > 0, // Only available if stock at THIS branch
        lowStock: branchSpecificStock > 0 && branchSpecificStock <= 5,
        variants: getAllVariants({ ...p, images: enrichedImages } as any), // Recalculate variants with enriched images
        branchStocks: relevantStocks, // Only return stocks for the selected branch
        vendorStocks, // NEW: Vendor breakdown at this branch
        hasMultipleVendors: vendorStocks.length > 1,
        branchId: branchId || null, // Echo back which branch this stock is for
      }
    })

    return NextResponse.json({
      products: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    console.error('[pos/products/search]', error)
    return NextResponse.json({ error: 'Failed to search products' }, { status: 500 })
  }
}
