import { NextRequest, NextResponse } from 'next/server'
import Service from '@/models/Service'
import dbConnect from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const featured = searchParams.get('featured') === 'true'

    let query: any = { isActive: true }

    if (type) {
      query.serviceType = type
    }

    if (featured) {
      query.isFeatured = true
    }

    const services = await Service.find(query).sort({ isFeatured: -1, createdAt: -1 })

    return NextResponse.json({
      success: true,
      services
    })
  } catch (error) {
    console.error('Get services error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    // Check authorization (admin only)
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const {
      name,
      slug,
      description,
      basePricePerKg,
      additionalPricePerKm,
      minimumChargePerShipment,
      serviceType,
      tiers,
      maxWeight,
      maxDimensions,
      handlingRules,
      availableCounties,
      estimatedDeliveryDays
    } = body

    // Validate required fields
    if (!name || !slug || !description || basePricePerKg === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existing = await Service.findOne({ slug })
    if (existing) {
      return NextResponse.json(
        { error: 'Service with this slug already exists' },
        { status: 400 }
      )
    }

    const service = new Service({
      name,
      slug,
      description,
      basePricePerKg,
      additionalPricePerKm: additionalPricePerKm || 0,
      minimumChargePerShipment: minimumChargePerShipment || 100,
      serviceType: serviceType || 'standard',
      tiers: tiers || [],
      maxWeight,
      maxDimensions,
      handlingRules: handlingRules || [],
      availableCounties: availableCounties || [],
      estimatedDeliveryDays: estimatedDeliveryDays || 1,
      isActive: true
    })

    await service.save()

    return NextResponse.json({
      success: true,
      service
    })
  } catch (error) {
    console.error('Create service error:', error)
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    )
  }
}
