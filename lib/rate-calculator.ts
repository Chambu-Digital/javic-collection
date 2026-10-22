import mongoose from 'mongoose'
import RateCard from '@/models/RateCard'
import Service from '@/models/Service'
import { IRateCalculation } from '@/models/Shipment'

export interface RateQuoteParams {
  serviceId: string
  pickupCounty: string
  deliveryCounty: string
  totalWeight: number // in kg
  estimatedDistance?: number // in km
  selectedTier?: string // e.g., "express", "standard"
  surchargeTypes?: string[] // e.g., ["fragile", "temperature-controlled"]
}

export interface RateQuoteResponse {
  success: boolean
  error?: string
  quote?: IRateCalculation
}

/**
 * Calculate shipment rate based on service, weight, distance, and surcharges
 */
export async function calculateShipmentRate(params: RateQuoteParams): Promise<RateQuoteResponse> {
  try {
    const {
      serviceId,
      pickupCounty,
      deliveryCounty,
      totalWeight,
      estimatedDistance = 0,
      selectedTier,
      surchargeTypes = []
    } = params

    // Fetch service
    const service = await Service.findById(serviceId)
    if (!service) {
      return { success: false, error: 'Service not found' }
    }

    // Fetch applicable rate card
    const rateCard = await RateCard.findOne({
      serviceId,
      isActive: true,
      effectiveFrom: { $lte: new Date() },
      $or: [
        { effectiveUntil: { $exists: false } },
        { effectiveUntil: { $gte: new Date() } }
      ]
    })

    if (!rateCard) {
      return { success: false, error: 'No active rate card found for this service' }
    }

    // Find weight bracket
    const weightBracket = rateCard.weightBrackets.find(
      (b) => totalWeight >= b.minWeight && totalWeight <= b.maxWeight
    )
    
    if (!weightBracket) {
      return { success: false, error: 'Shipment weight exceeds maximum allowed' }
    }

    // Find distance bracket
    let distanceBracket = rateCard.distanceBrackets[0]
    if (estimatedDistance > 0) {
      distanceBracket = rateCard.distanceBrackets.find(
        (b) => estimatedDistance >= b.minDistance && estimatedDistance <= b.maxDistance
      ) || rateCard.distanceBrackets[rateCard.distanceBrackets.length - 1]
    }

    // Calculate base price
    const basePrice = totalWeight * weightBracket.pricePerKg

    // Get tier multiplier if selected
    let tierMultiplier = 1
    if (selectedTier && service.tiers && service.tiers.length > 0) {
      const tier = service.tiers.find((t) => t.name.toLowerCase() === selectedTier.toLowerCase())
      if (tier) {
        tierMultiplier = tier.multiplier
      }
    }

    const basePriceWithTier = basePrice * tierMultiplier

    // Calculate distance price
    const distancePrice = (estimatedDistance || 0) * distanceBracket.pricePerKm

    // Calculate surcharges
    let totalSurcharges = 0
    const appliedSurcharges: Array<{ name: string; amount: number }> = []

    for (const surchargeType of surchargeTypes) {
      const surcharge = rateCard.surcharges.find((s) => s.type === surchargeType)
      if (surcharge) {
        appliedSurcharges.push({ name: surcharge.name, amount: surcharge.amount })
        totalSurcharges += surcharge.amount
      }
    }

    // Calculate total
    let subtotal = basePriceWithTier + distancePrice + totalSurcharges
    const total = Math.max(subtotal, rateCard.minimumChargePerShipment)

    const quote: IRateCalculation = {
      basePricePerKg: weightBracket.pricePerKg,
      tierMultiplier: tierMultiplier,
      totalWeight: totalWeight,
      basePrice: basePriceWithTier,

      distancePricePerKm: distanceBracket.pricePerKm,
      estimatedDistance: estimatedDistance || 0,
      distancePrice: distancePrice,

      surcharges: appliedSurcharges,

      minimumCharge: rateCard.minimumChargePerShipment,
      total: subtotal,
      finalTotal: total
    }

    return { success: true, quote }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to calculate rate'
    return { success: false, error: message }
  }
}

/**
 * Get all applicable surcharges for a service
 */
export async function getServiceSurcharges(serviceId: string) {
  try {
    const rateCard = await RateCard.findOne({ serviceId, isActive: true })
    if (!rateCard) return []
    return rateCard.surcharges
  } catch (error) {
    console.error('Error fetching surcharges:', error)
    return []
  }
}

/**
 * Validate shipment weight and dimensions against service limits
 */
export function validateShipmentSize(
  totalWeight: number,
  dimensions?: { length: number; width: number; height: number },
  serviceLimits?: any
): { valid: boolean; error?: string } {
  if (!serviceLimits) {
    return { valid: true }
  }

  if (serviceLimits.maxWeight && totalWeight > serviceLimits.maxWeight) {
    return {
      valid: false,
      error: `Shipment weight ${totalWeight}kg exceeds maximum of ${serviceLimits.maxWeight}kg`
    }
  }

  if (dimensions && serviceLimits.maxDimensions) {
    const { length, width, height } = dimensions
    const { length: maxL, width: maxW, height: maxH } = serviceLimits.maxDimensions

    if (length > maxL || width > maxW || height > maxH) {
      return {
        valid: false,
        error: `Shipment dimensions exceed maximum allowed (${maxL}x${maxW}x${maxH})`
      }
    }
  }

  return { valid: true }
}
