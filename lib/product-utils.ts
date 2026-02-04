import { IProduct } from '@/models/Product'

/**
 * Get the main display image for a product
 * For variant products: use cheapest variant's image
 * For simple products: use first product image
 */
export function getProductDisplayImage(product: IProduct): string {
  // If product has variants, use the cheapest active variant's image
  if (product.hasVariants && product.variants && product.variants.length > 0) {
    const activeVariants = product.variants.filter(variant => variant.isActive)
    if (activeVariants.length > 0) {
      // Find the cheapest active variant
      const cheapestVariant = activeVariants.reduce((cheapest, current) => 
        current.price < cheapest.price ? current : cheapest
      )
      if (cheapestVariant.image) {
        return cheapestVariant.image
      }
    }
    // Fallback to cheapest variant if no active variants
    if (product.variants.length > 0) {
      const cheapestVariant = product.variants.reduce((cheapest, current) => 
        current.price < cheapest.price ? current : cheapest
      )
      if (cheapestVariant.image) {
        return cheapestVariant.image
      }
    }
  }
  
  // For simple products or fallback, use product images
  if (product.images && product.images.length > 0) {
    return product.images[0]
  }
  
  // Final fallback
  return '/placeholder.svg'
}

/**
 * Get the display price for a product
 * For variant products: use cheapest active variant's price
 * For simple products: use product price
 */
export function getProductDisplayPrice(product: IProduct): { price: number; oldPrice?: number } {
  // If product has variants, use the cheapest active variant's price
  if (product.hasVariants && product.variants && product.variants.length > 0) {
    const activeVariants = product.variants.filter(variant => variant.isActive)
    if (activeVariants.length > 0) {
      // Find the cheapest active variant
      const cheapestVariant = activeVariants.reduce((cheapest, current) => 
        current.price < cheapest.price ? current : cheapest
      )
      return {
        price: cheapestVariant.price,
        oldPrice: cheapestVariant.oldPrice
      }
    }
    // Fallback to cheapest variant if no active variants
    if (product.variants.length > 0) {
      const cheapestVariant = product.variants.reduce((cheapest, current) => 
        current.price < cheapest.price ? current : cheapest
      )
      return {
        price: cheapestVariant.price,
        oldPrice: cheapestVariant.oldPrice
      }
    }
  }
  
  // For simple products or fallback, use product price
  return {
    price: product.price,
    oldPrice: product.oldPrice
  }
}

/**
 * Check if a product is in stock
 * For variant products: check if any variant is in stock
 * For simple products: use product stock status
 */
export function getProductStockStatus(product: IProduct): { inStock: boolean; stockCount: number } {
  // If product has variants, check variant stock
  if (product.hasVariants && product.variants && product.variants.length > 0) {
    const totalStock = product.variants
      .filter(variant => variant.isActive)
      .reduce((sum, variant) => sum + variant.stock, 0)
    
    return {
      inStock: totalStock > 0,
      stockCount: totalStock
    }
  }
  
  // For simple products, use product stock
  return {
    inStock: product.inStock,
    stockCount: product.stockQuantity
  }
}

/**
 * Calculate pricing based on quantity (retail vs wholesale)
 */
export function calculateVariantPricing(variant: IVariant, quantity: number) {
  const hasWholesale = variant.wholesalePrice && variant.wholesaleThreshold
  const isWholesale = hasWholesale && quantity >= variant.wholesaleThreshold!
  
  const unitPrice = isWholesale ? variant.wholesalePrice! : variant.price
  const totalPrice = unitPrice * quantity
  const retailTotal = variant.price * quantity
  const savings = isWholesale ? retailTotal - totalPrice : 0
  const savingsPercentage = isWholesale ? Math.round((savings / retailTotal) * 100) : 0
  
  return {
    unitPrice,
    totalPrice,
    savings,
    savingsPercentage,
    isWholesale,
    hasWholesale: !!hasWholesale,
    wholesaleThreshold: variant.wholesaleThreshold || 0,
    wholesalePrice: variant.wholesalePrice || 0
  }
}

/**
 * Get wholesale availability info for a variant
 */
export function getWholesaleInfo(variant: IVariant) {
  const hasWholesale = !!(variant.wholesalePrice && variant.wholesaleThreshold)
  
  if (!hasWholesale) {
    return { hasWholesale: false }
  }
  
  const savingsPerUnit = variant.price - variant.wholesalePrice!
  const savingsPercentage = Math.round((savingsPerUnit / variant.price) * 100)
  
  return {
    hasWholesale: true,
    wholesalePrice: variant.wholesalePrice!,
    wholesaleThreshold: variant.wholesaleThreshold!,
    savingsPerUnit,
    savingsPercentage
  }
}