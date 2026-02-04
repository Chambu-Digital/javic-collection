import connectDB from '@/lib/mongodb'
import County from '@/models/County'
import Area from '@/models/Area'

export interface ShippingInfo {
  fee: number
  estimatedDeliveryDays: number
  areaName?: string
  countyName: string
}

/**
 * Calculate shipping fee and delivery time for a given area or county
 */
export async function calculateShipping(
  countyId: string, 
  areaId?: string
): Promise<ShippingInfo | null> {
  try {
    await connectDB()

    // If area is specified, get area-specific shipping info
    if (areaId) {
      const area = await Area.findById(areaId)
        .populate('countyId', 'name')
        .lean()
      
      if (area && area.isActive) {
        // Use area fee if explicitly set (including 0 for free shipping)
        // Only fall back to county if area fee is not set (undefined/null)
        if (area.shippingFee !== undefined && area.shippingFee !== null) {
          return {
            fee: area.shippingFee,
            estimatedDeliveryDays: area.estimatedDeliveryDays,
            areaName: area.name,
            countyName: area.countyName
          }
        }
        // Area fee not set, fall through to use county default
      }
    }

    // Fall back to county default shipping
    const county = await County.findById(countyId).lean()
    
    if (county && county.isActive) {
      return {
        fee: county.defaultShippingFee,
        estimatedDeliveryDays: county.estimatedDeliveryDays,
        countyName: county.name
      }
    }

    return null
  } catch (error) {
    console.error('Error calculating shipping:', error)
    return null
  }
}

/**
 * Get all active counties for shipping selection
 */
export async function getActiveCounties() {
  try {
    await connectDB()
    
    const counties = await County.find({ isActive: true })
      .select('_id name code defaultShippingFee estimatedDeliveryDays')
      .sort({ name: 1 })
      .lean()
    
    return counties
  } catch (error) {
    console.error('Error fetching counties:', error)
    return []
  }
}

/**
 * Get all active areas for a specific county
 */
export async function getActiveAreas(countyId: string) {
  try {
    await connectDB()
    
    const areas = await Area.find({ 
      countyId, 
      isActive: true 
    })
      .select('_id name shippingFee estimatedDeliveryDays')
      .sort({ name: 1 })
      .lean()
    
    return areas
  } catch (error) {
    console.error('Error fetching areas:', error)
    return []
  }
}

/**
 * Validate if a county and area combination is valid
 */
export async function validateShippingLocation(
  countyId: string, 
  areaId?: string
): Promise<boolean> {
  try {
    await connectDB()

    const county = await County.findById(countyId).lean()
    if (!county || !county.isActive) {
      return false
    }

    if (areaId) {
      const area = await Area.findOne({ 
        _id: areaId, 
        countyId, 
        isActive: true 
      }).lean()
      
      return !!area
    }

    return true
  } catch (error) {
    console.error('Error validating shipping location:', error)
    return false
  }
}