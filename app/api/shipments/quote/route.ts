import { NextRequest, NextResponse } from 'next/server'
import { calculateShipmentRate } from '@/lib/rate-calculator'
import Service from '@/models/Service'
import dbConnect from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const body = await req.json()
    const {
      serviceId,
      pickupCounty,
      deliveryCounty,
      totalWeight,
      estimatedDistance,
      selectedTier,
      surchargeTypes
    } = body

    // Validate required fields
    if (!serviceId || !pickupCounty || !deliveryCounty || !totalWeight) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if service exists
    const service = await Service.findById(serviceId)
    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Calculate rate
    const result = await calculateShipmentRate({
      serviceId,
      pickupCounty,
      deliveryCounty,
      totalWeight,
      estimatedDistance,
      selectedTier,
      surchargeTypes: surchargeTypes || []
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      quote: result.quote,
      service: {
        name: service.name,
        estimatedDeliveryDays: service.estimatedDeliveryDays,
        serviceType: service.serviceType
      }
    })
  } catch (error) {
    console.error('Quote error:', error)
    return NextResponse.json(
      { error: 'Failed to generate quote' },
      { status: 500 }
    )
  }
}
