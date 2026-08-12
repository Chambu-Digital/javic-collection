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
 * Get the display price for a product with safeguards against incorrect formatting
 */
export function getProductDisplayPrice(product: IProduct): { price: number; oldPrice?: number } {
  // Safeguard: If price seems too high (like it has an extra zero), check if dividing by 10 makes sense
  let displayPrice = product.price;
  
  // If price is exactly 10x what it should be (between 19000-21000 when it should be 1900-2100)
  if (displayPrice >= 19000 && displayPrice <= 21000) {
    const potentialCorrectPrice = displayPrice / 10;
    if (potentialCorrectPrice >= 1900 && potentialCorrectPrice <= 2100) {
      console.warn(`⚠️ Price correction applied for product ${product.name}: ${displayPrice} → ${potentialCorrectPrice}`);
      displayPrice = potentialCorrectPrice;
    }
  }
  
  return {
    price: displayPrice,
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
