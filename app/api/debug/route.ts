import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'

export async function GET() {
  try {
    await connectDB()
    
    const products = await Product.find({}).limit(10)
    const categories = await Category.find({}).limit(10)
    
    return NextResponse.json({
      totalProducts: await Product.countDocuments({}),
      totalCategories: await Category.countDocuments({}),
      sampleProducts: products.map(p => ({
        _id: p._id.toString(),
        name: p.name,
        isActive: p.isActive,
        category: p.category
      })),
      sampleCategories: categories.map(c => ({
        _id: c._id.toString(),
        name: c.name,
        isActive: c.isActive
      }))
    })
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debug info' },
      { status: 500 }
    )
  }
}
