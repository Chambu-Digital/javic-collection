import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { requireAdmin } from '@/lib/auth'
import Product from '@/models/Product'
import Category from '@/models/Category'
import Order from '@/models/Order'
import Campaign from '@/models/Campaign'
import Review from '@/models/Review'
import MpesaTransaction from '@/models/MpesaTransaction'
import BlogPost from '@/models/BlogPost'
import Banner from '@/models/Banner'
import AdminRequest from '@/models/AdminRequest'
import User from '@/models/User'

// Extra safety: require a hard-coded confirmation token in the request header
// Change this to something secret before using in production
const CONFIRMATION_TOKEN = process.env.CLEAR_DB_TOKEN || ''

export async function DELETE(request: NextRequest) {
  try {
    // Must be logged-in admin or super_admin
    const admin = await requireAdmin(request)

    // Require the confirmation token header to prevent accidental triggers
    const confirmToken = request.headers.get('x-confirm-token')
    if (!CONFIRMATION_TOKEN) {
      return NextResponse.json(
        { error: 'CLEAR_DB_TOKEN env variable is not set. Add it to .env.local before using this endpoint.' },
        { status: 500 }
      )
    }
    if (confirmToken !== CONFIRMATION_TOKEN) {
      return NextResponse.json(
        { error: 'Missing or invalid x-confirm-token header' },
        { status: 403 }
      )
    }

    await connectDB()

    // Collections to wipe (preserves admin/super_admin user accounts)
    const results: Record<string, number> = {}

    results.products = (await Product.deleteMany({})).deletedCount
    results.categories = (await Category.deleteMany({})).deletedCount
    results.orders = (await Order.deleteMany({})).deletedCount
    results.campaigns = (await Campaign.deleteMany({})).deletedCount
    results.reviews = (await Review.deleteMany({})).deletedCount
    results.mpesaTransactions = (await MpesaTransaction.deleteMany({})).deletedCount
    results.blogPosts = (await BlogPost.deleteMany({})).deletedCount
    results.banners = (await Banner.deleteMany({})).deletedCount
    results.adminRequests = (await AdminRequest.deleteMany({})).deletedCount

    // Delete customer accounts only — keep admin & super_admin accounts
    results.customers = (
      await User.deleteMany({ role: 'customer' })
    ).deletedCount

    console.log(`[clear-database] Database cleared by ${admin.email}:`, results)

    return NextResponse.json({
      success: true,
      message: 'Database cleared successfully. Admin accounts were preserved.',
      deleted: results,
      clearedBy: admin.email,
      clearedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[clear-database] Error:', error)
    if (
      error.message === 'Admin access required' ||
      error.message === 'Authentication required'
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error', detail: error.message },
      { status: 500 }
    )
  }
}

// GET – show what would be deleted (dry run, still requires auth)
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)

    await connectDB()

    const counts = {
      products: await Product.countDocuments(),
      categories: await Category.countDocuments(),
      orders: await Order.countDocuments(),
      campaigns: await Campaign.countDocuments(),
      reviews: await Review.countDocuments(),
      mpesaTransactions: await MpesaTransaction.countDocuments(),
      blogPosts: await BlogPost.countDocuments(),
      banners: await Banner.countDocuments(),
      adminRequests: await AdminRequest.countDocuments(),
      customers: await User.countDocuments({ role: 'customer' }),
      admins: await User.countDocuments({ role: { $in: ['admin', 'super_admin'] } }),
    }

    return NextResponse.json({
      message: 'Dry run — these are the counts that would be deleted (admins are preserved).',
      counts,
    })
  } catch (error: any) {
    if (
      error.message === 'Admin access required' ||
      error.message === 'Authentication required'
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error', detail: error.message },
      { status: 500 }
    )
  }
}
