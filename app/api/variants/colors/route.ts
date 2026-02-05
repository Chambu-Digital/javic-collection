import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'

export async function GET() {
  try {
    await connectDB()
    
    // Get all unique colors from existing product variants
    const products = await Product.find({ hasVariants: true }, { variants: 1 })
    const colors = new Set<string>()
    
    products.forEach(product => {
      if (product.variants) {
        product.variants.forEach(variant => {
          if (variant.color) {
            colors.add(variant.color)
          }
        })
      }
    })
    
    // Convert to sorted array
    const sortedColors = Array.from(colors).sort()
    
    return NextResponse.json(sortedColors)
  } catch (error) {
    console.error('Error fetching colors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch colors' },
      { status: 500 }
    )
  }
}