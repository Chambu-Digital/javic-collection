import { IProduct } from '@/models/Product'

/**
 * Get the main display image for a product (first image or placeholder)
 */
export function getProductDisplayImage(product: IProduct): string {
  if (product.images && product.images.length > 0) {
    return product.images[0].url ?? '/placeholder.svg'
  }
  return '/placeholder.svg'
}

/**
 * Get the display price for a product
 */
export function getProductDisplayPrice(product: IProduct): { price: number; oldPrice?: number } {
  return {
    price: product.price,
    oldPrice: product.oldPrice,
  }
}

/**
 * Check if a product is in stock
 */
export function getProductStockStatus(product: IProduct): { inStock: boolean; stockCount: number } {
  return {
    inStock: product.inStock,
    stockCount: product.stockQuantity,
  }
}

/**
 * Calculate pricing based on quantity (retail vs wholesale)
 */
export function calculateProductPricing(product: IProduct, quantity: number) {
  const hasWholesale = !!(product.wholesalePrice && product.wholesaleThreshold)
  const isWholesale = hasWholesale && quantity >= product.wholesaleThreshold!

  const unitPrice = isWholesale ? product.wholesalePrice! : product.price
  const totalPrice = unitPrice * quantity
  const retailTotal = product.price * quantity
  const savings = isWholesale ? retailTotal - totalPrice : 0
  const savingsPercentage = isWholesale ? Math.round((savings / retailTotal) * 100) : 0

  return {
    unitPrice,
    totalPrice,
    savings,
    savingsPercentage,
    isWholesale,
    hasWholesale,
    wholesaleThreshold: product.wholesaleThreshold || 0,
    wholesalePrice: product.wholesalePrice || 0,
  }
}

/**
 * Get wholesale info for display — returns null if no wholesale pricing
 */
export function getWholesaleInfo(product: IProduct): { price: number; threshold: number; savingsPercent: number } | null {
  if (!product.wholesalePrice || !product.wholesaleThreshold) return null
  return {
    price: product.wholesalePrice,
    threshold: product.wholesaleThreshold,
    savingsPercent: Math.round(((product.price - product.wholesalePrice) / product.price) * 100),
  }
}
