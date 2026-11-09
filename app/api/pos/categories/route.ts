import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Category from '@/models/Category'
import Product from '@/models/Product'
import { requireAuth } from '@/lib/auth'
import mongoose from 'mongoose'

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/**
 * GET /api/pos/categories
 * Returns all categories with product count. Supports ?includeInactive=true.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user.role !== 'super_admin' && (user.role !== 'admin' || !user.canAccessPOS)) {
      return NextResponse.json({ error: 'POS access required' }, { status: 403 })
    }

    await connectDB()
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const search = searchParams.get('search') || ''

    const query: any = {}
    if (!includeInactive) query.isActive = true
    if (search) query.name = { $regex: search, $options: 'i' }

    const categories = await Category.find(query).sort({ name: 1 }).lean()

    // Get product counts in one aggregation
    const counts = await Product.aggregate([
      { $match: { categoryId: { $in: categories.map((c: any) => c._id) } } },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
    ])
    const countMap = new Map(counts.map((c: any) => [c._id.toString(), c.count]))

    const result = categories.map((c: any) => ({
      _id:         c._id,
      name:        c.name,
      slug:        c.slug,
      description: c.description,
      image:       c.image,
      icon:        c.icon,
      isActive:    c.isActive,
      productCount:countMap.get(c._id.toString()) || 0,
      createdAt:   c.createdAt,
    }))

    return NextResponse.json({ categories: result })
  } catch (error: any) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch categories' }, { status: 500 })
  }
}

/**
 * POST /api/pos/categories
 * Create a new category. Auth: admin / super_admin.
 * Body: { name, description?, image?, icon? }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user.role !== 'super_admin' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    await connectDB()
    const body = await request.json()
    const { name, description, image, icon } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const slug = slugify(name.trim())

    // Duplicate name check
    const existing = await Category.findOne({ slug })
    if (existing) {
      return NextResponse.json({ error: `A category named "${name}" already exists` }, { status: 400 })
    }

    const category = new Category({
      name:        name.trim(),
      slug,
      description: description?.trim() || name.trim(),
      image:       image || '/placeholder.svg',
      icon:        icon || '📦',
      isActive:    true,
    })
    await category.save()

    return NextResponse.json({ success: true, category }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 500 })
  }
}
