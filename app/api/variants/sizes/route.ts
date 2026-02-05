import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'

export async function GET() {
  try {
    await connectDB()
    
    // Get all unique sizes from existing product variants
    const products = await Product.find({ hasVariants: true }, { variants: 1 })
    const sizes = new Set<string>()
    
    products.forEach(product => {
      if (product.variants) {
        product.variants.forEach(variant => {
          if (variant.availableSizes) {
            variant.availableSizes.forEach(size => {
              sizes.add(size)
            })
          }
        })
      }
    })
    
    // Convert to sorted array
    const sortedSizes = Array.from(sizes).sort((a, b) => {
      // Custom sort to put sizes in logical order
      const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL', 'One Size', 'Free Size']
      const aIndex = sizeOrder.indexOf(a)
      const bIndex = sizeOrder.indexOf(b)
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex
      } else if (aIndex !== -1) {
        return -1
      } else if (bIndex !== -1) {
        return 1
      } else {
        return a.localeCompare(b)
      }
    })
    
    return NextResponse.json(sortedSizes)
  } catch (error) {
    console.error('Error fetching sizes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sizes' },
      { status: 500 }
    )
  }
}