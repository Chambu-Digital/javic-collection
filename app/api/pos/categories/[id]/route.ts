import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Category from '@/models/Category'
import Product from '@/models/Product'
import { requireAuth } from '@/lib/auth'
import mongoose from 'mongoose'

type Ctx = { params: Promise<{ id: string }> }

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/**
 * PATCH /api/pos/categories/[id]
 * Edit a category: name, description, image, icon, isActive.
 * Syncs the denormalised `category` name on all linked products when name changes.
 */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  const session = await mongoose.startSession()
  try {
    const user = await requireAuth(request)
    if (user.role !== 'super_admin' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    await connectDB()
    const { id } = await params
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 })
    }

    const body = await request.json()
    const { name, description, image, icon, isActive } = body

    await session.withTransaction(async () => {
      const category = await Category.findById(id).session(session)
      if (!category) throw new Error('Category not found')

      let nameChanged = false

      if (name !== undefined) {
        const trimmed = String(name).trim()
        if (!trimmed) throw new Error('Category name cannot be empty')
        const newSlug = slugify(trimmed)

        // Duplicate check (excluding this category)
        const dup = await Category.findOne({ slug: newSlug, _id: { $ne: id } }).session(session)
        if (dup) throw new Error(`A category named "${trimmed}" already exists`)

        if (trimmed !== category.name) {
          nameChanged = true
          category.name = trimmed
          category.slug = newSlug
        }
      }
      if (description !== undefined) category.description = String(description).trim()
      if (image       !== undefined) category.image       = String(image)
      if (icon        !== undefined) category.icon        = String(icon)
      if (isActive    !== undefined) category.isActive    = Boolean(isActive)

      await category.save({ session })

      // Sync denormalised name on products
      if (nameChanged) {
        await Product.updateMany(
          { categoryId: category._id },
          { $set: { category: category.name } },
          { session }
        )
      }
    })

    await session.endSession()
    const updated = await Category.findById(id).lean()
    return NextResponse.json({ success: true, category: updated })
  } catch (error: any) {
    await session.endSession()
    console.error('Error updating category:', error)
    return NextResponse.json({ error: error.message || 'Failed to update category' }, { status: 500 })
  }
}

/**
 * DELETE /api/pos/categories/[id]
 * Safe delete logic:
 *   - If the category has 0 products → hard delete.
 *   - If it has products and reassignToId is provided → reassign then delete.
 *   - If it has products and no reassignment → archive (isActive = false) only.
 *
 * Body (optional): { reassignToId?: string }
 */
export async function DELETE(request: NextRequest, { params }: Ctx) {
  const session = await mongoose.startSession()
  try {
    const user = await requireAuth(request)
    if (user.role !== 'super_admin' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    await connectDB()
    const { id } = await params
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 })
    }

    let reassignToId: string | undefined
    try {
      const body = await request.json()
      reassignToId = body?.reassignToId
    } catch { /* no body is fine */ }

    const category = await Category.findById(id)
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const productCount = await Product.countDocuments({ categoryId: id })

    if (productCount === 0) {
      // Safe to hard-delete
      await Category.findByIdAndDelete(id)
      return NextResponse.json({ success: true, action: 'deleted' })
    }

    if (reassignToId) {
      if (!mongoose.isValidObjectId(reassignToId)) {
        return NextResponse.json({ error: 'Invalid reassign category ID' }, { status: 400 })
      }
      const target = await Category.findById(reassignToId).lean()
      if (!target) {
        return NextResponse.json({ error: 'Reassign target category not found' }, { status: 400 })
      }

      await session.withTransaction(async () => {
        // Move all products to the target category
        await Product.updateMany(
          { categoryId: new mongoose.Types.ObjectId(id) },
          { $set: { categoryId: target._id, category: target.name } },
          { session }
        )
        // Now delete (products are gone)
        await Category.findByIdAndDelete(id).session(session)
      })
      await session.endSession()

      return NextResponse.json({ success: true, action: 'reassigned_and_deleted', movedProducts: productCount })
    }

    // Products exist but no reassignment — archive instead
    await Category.findByIdAndUpdate(id, { isActive: false })
    await session.endSession()

    return NextResponse.json({
      success: true,
      action: 'archived',
      productCount,
      message: `Category archived. It has ${productCount} product${productCount !== 1 ? 's' : ''} — reassign them first to delete the category.`,
    })
  } catch (error: any) {
    await session.endSession()
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete category' }, { status: 500 })
  }
}
