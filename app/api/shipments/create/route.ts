import { NextRequest, NextResponse } from 'next/server'
import Shipment from '@/models/Shipment'
import Service from '@/models/Service'
import { calculateShipmentRate } from '@/lib/rate-calculator'
import { getCurrentUser, requireAuth } from '@/lib/auth'
import dbConnect from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    // Get current user (optional - allow guest shipments too)
    const user = await getCurrentUser(req)

    const body = await req.json()
    const {
      serviceId,
      pickupLocation,
      deliveryLocation,
      items,
      selectedTier,
      surchargeTypes,
      specialInstructions,
      signatureRequired,
      insuranceApplied,
      customerEmail,
      customerPhone
    } = body

    // Validate required fields
    if (
      !serviceId ||
      !pickupLocation ||
      !deliveryLocation ||
      !items ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: 'Missing required shipment fields' },
        { status: 400 }
      )
    }

    // Calculate total weight and value
    const totalWeight = items.reduce((sum: number, item: any) => sum + (item.weight * item.quantity), 0)
    const totalValue = items.reduce((sum: number, item: any) => sum + (item.value * item.quantity), 0)

    // Estimate distance (in production, use maps API)
    const estimatedDistance = 50 // Placeholder

    // Calculate rate
    const rateResult = await calculateShipmentRate({
      serviceId,
      pickupCounty: pickupLocation.county,
      deliveryCounty: deliveryLocation.county,
      totalWeight,
      estimatedDistance,
      selectedTier,
      surchargeTypes: surchargeTypes || []
    })

    if (!rateResult.success) {
      return NextResponse.json(
        { error: rateResult.error },
        { status: 400 }
      )
    }

    // Get service for estimated delivery date
    const service = await Service.findById(serviceId)
    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Create shipment
    const estimatedDeliveryDate = new Date()
    estimatedDeliveryDate.setDate(
      estimatedDeliveryDate.getDate() + (service.estimatedDeliveryDays || 1)
    )

    const shipment = new Shipment({
      userId: user?._id,
      customerEmail: customerEmail || user?.email,
      customerPhone,
      serviceId,
      selectedTier,
      pickupLocation,
      deliveryLocation,
      items,
      totalWeight,
      totalValue,
      estimatedDistance,
      estimatedDeliveryDate,
      rateCalculation: rateResult.quote,
      status: 'quoted',
      paymentStatus: 'pending',
      specialInstructions,
      signatureRequired: signatureRequired || false,
      insuranceApplied: insuranceApplied || false,
      serviceHistory: [
        {
          timestamp: new Date(),
          status: 'quoted',
          notes: 'Shipment quote created'
        }
      ]
    })

    await shipment.save()

    return NextResponse.json({
      success: true,
      shipment: {
        _id: shipment._id,
        shipmentNumber: shipment.shipmentNumber,
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        totalWeight: shipment.totalWeight,
        estimatedDeliveryDate: shipment.estimatedDeliveryDate,
        quote: rateResult.quote
      }
    })
  } catch (error) {
    console.error('Create shipment error:', error)
    return NextResponse.json(
      { error: 'Failed to create shipment' },
      { status: 500 }
    )
  }
}
