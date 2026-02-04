import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import User from '@/models/User'
import Product from '@/models/Product'
import { requireAuth } from '@/lib/auth'
import mongoose from 'mongoose'
import { z } from 'zod'

const orderItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  productImage: z.string(),
  variantId: z.string().optional(),
  variantDetails: z.object({
    type: z.string(),
    value: z.string(),
    sku: z.string()
  }).optional(),
  quantity: z.number().min(1),
  price: z.number().min(0),
  totalPrice: z.number().min(0)
})

const shippingAddressSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  county: z.string().min(1),
  area: z.string().min(1)
})

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(['mpesa', 'cash_on_delivery']),
  shippingCost: z.number().min(0).optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  customerNotes: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Order creation request:', JSON.stringify(body, null, 2))
    
    // Validate input
    const validatedData = createOrderSchema.parse(body)
    
    await connectDB()
    
    let userId: string | null = null
    let customerEmail = validatedData.customerEmail || ''
    
    // Try to get authenticated user
    try {
      const user = await requireAuth(request)
      userId = user.id
      
      // Get user details for email if not provided
      if (!customerEmail) {
        const userData = await User.findById(userId)
        if (userData) {
          customerEmail = userData.email
        }
      }
    } catch (error) {
      // Guest checkout - continue without user
      if (!customerEmail) {
        return NextResponse.json(
          { error: 'Email is required for guest checkout' },
          { status: 400 }
        )
      }
    }
    
    // Verify products exist and calculate totals
    let calculatedSubtotal = 0
    const verifiedItems = []
    
    for (const item of validatedData.items) {
      console.log('Processing item:', {
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.totalPrice
      })
      
      const product = await Product.findById(item.productId)
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productName}` },
          { status: 400 }
        )
      }
      
      console.log('Product pricing info:', {
        hasVariants: product.hasVariants,
        regularPrice: product.price,
        wholesalePrice: product.wholesalePrice,
        wholesaleThreshold: product.wholesaleThreshold,
        variantCount: product.variants?.length || 0
      })
      
      // Verify pricing with variant and wholesale logic
      let expectedPrice = product.price
      let variant = null
      
      // If product has variants and item has variantId, get variant pricing
      if (product.hasVariants && item.variantId && product.variants) {
        variant = product.variants.find(v => v.id === item.variantId)
        if (variant) {
          expectedPrice = variant.price
          
          // Check if wholesale pricing applies for this variant
          if (variant.wholesalePrice && variant.wholesaleThreshold && item.quantity >= variant.wholesaleThreshold) {
            expectedPrice = variant.wholesalePrice
          }
        } else {
          return NextResponse.json(
            { error: `Variant not found: ${item.variantId} for ${item.productName}` },
            { status: 400 }
          )
        }
      } else {
        // Simple product - check wholesale pricing on main product
        if (product.wholesalePrice && product.wholesaleThreshold && item.quantity >= product.wholesaleThreshold) {
          expectedPrice = product.wholesalePrice
        }
      }
      
      // Allow small floating point differences (1 cent tolerance)
      if (Math.abs(item.price - expectedPrice) > 0.01) {
        console.error('Price validation failed:', {
          productName: item.productName,
          itemPrice: item.price,
          expectedPrice,
          quantity: item.quantity,
          hasVariants: product.hasVariants,
          variantId: item.variantId,
          variantFound: !!variant,
          variantPrice: variant?.price,
          variantWholesalePrice: variant?.wholesalePrice,
          variantWholesaleThreshold: variant?.wholesaleThreshold,
          productPrice: product.price,
          productWholesalePrice: product.wholesalePrice,
          productWholesaleThreshold: product.wholesaleThreshold
        })
        return NextResponse.json(
          { error: `Price mismatch for ${item.productName}. Expected: ${expectedPrice}, Got: ${item.price}` },
          { status: 400 }
        )
      }
      
      calculatedSubtotal += item.totalPrice
      verifiedItems.push({
        ...item,
        productId: new mongoose.Types.ObjectId(item.productId)
      })
    }
    
    // Calculate shipping cost
    let shippingCost = validatedData.shippingCost || 0
    
    // If no shipping cost provided, calculate it based on address
    if (shippingCost === 0 && validatedData.shippingAddress.county && validatedData.shippingAddress.area) {
      try {
        // Import the shipping utility function
        const { calculateShipping } = await import('@/lib/shipping-utils')
        
        // Find county by name
        const County = (await import('@/models/County')).default
        const Area = (await import('@/models/Area')).default
        
        const county = await County.findOne({ name: validatedData.shippingAddress.county })
        if (county) {
          const area = await Area.findOne({ 
            name: validatedData.shippingAddress.area,
            countyId: county._id 
          })
          
          // Use area fee if explicitly set (including 0 for free shipping)
          // Only fall back to county if area fee is not set (undefined/null)
          if (area && area.shippingFee !== undefined && area.shippingFee !== null) {
            shippingCost = area.shippingFee
          } else {
            shippingCost = county.defaultShippingFee
          }
        }
      } catch (error) {
        console.error('Error calculating shipping:', error)
        // Continue with free shipping if calculation fails
      }
    }
    
    const taxAmount = 0 // No VAT
    const totalAmount = calculatedSubtotal + shippingCost
    
    // Generate order number
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    
    // Find the last order of the day
    const lastOrder = await Order.findOne({
      orderNumber: new RegExp(`^SN${year}${month}${day}`)
    }).sort({ orderNumber: -1 })
    
    let sequence = 1
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-3))
      sequence = lastSequence + 1
    }
    
    const orderNumber = `SN${year}${month}${day}${sequence.toString().padStart(3, '0')}`
    
    // Create order
    const orderData = {
      orderNumber,
      userId: userId ? new mongoose.Types.ObjectId(userId) : new mongoose.Types.ObjectId('000000000000000000000000'),
      customerEmail,
      customerPhone: validatedData.customerPhone,
      items: verifiedItems,
      subtotal: calculatedSubtotal,
      shippingCost,
      taxAmount,
      discountAmount: 0,
      totalAmount,
      shippingAddress: validatedData.shippingAddress,
      paymentMethod: validatedData.paymentMethod === 'mpesa' ? 'mpesa' : 'cash_on_delivery',
      status: 'pending',
      paymentStatus: validatedData.paymentMethod === 'cash_on_delivery' ? 'pending' : 'pending',
      customerNotes: validatedData.customerNotes
    }
    
    const order = new Order(orderData)
    await order.save()
    
    // If M-Pesa payment, initiate payment process
    if (validatedData.paymentMethod === 'mpesa') {
      // TODO: Integrate with actual M-Pesa API
      // For now, we'll just mark as pending payment
    }
    
    return NextResponse.json({
      success: true,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod
      }
    })
    
  } catch (error: any) {
    console.error('Create order error:', error)
    
    if (error.name === 'ZodError') {
      console.error('Validation error details:', error.errors)
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.errors,
          message: error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
