/**
 * POS Pricing Utilities
 *
 * Single source of truth for how a unit price is resolved at the POS counter.
 *
 * Price resolution order (most specific wins):
 *   1. Variant-level price override  (product.images[n].price)
 *   2. Product-level price           (product.price)
 *
 * Wholesale resolution order (most specific wins):
 *   1. Variant-level wholesale price override (product.images[n].wholesalePrice)
 *   2. Product-level wholesale price          (product.wholesalePrice)
 *
 * At the physical POS counter the cashier controls the pricing mode for the
 * entire sale via the Retail / Wholesale toggle. There is no minimum-quantity
 * gate at the counter — a single unit may be sold at the wholesale price.
 */

export interface VariantPricing {
  /** Retail price: variant override if set, otherwise product-level */
  retail: number
  /** Wholesale price: variant override if set, otherwise product-level (null if none) */
  wholesale: number | null
}

/**
 * Resolve the retail and wholesale prices for a specific variant.
 *
 * @param productRetail     Product-level retail price (product.price)
 * @param productWholesale  Product-level wholesale price (product.wholesalePrice)
 * @param variantRetail     Variant-level retail override (image.price) — null if not set
 * @param variantWholesale  Variant-level wholesale override (image.wholesalePrice) — null if not set
 */
export function resolveVariantPricing(
  productRetail: number,
  productWholesale: number | null | undefined,
  variantRetail: number | null | undefined,
  variantWholesale: number | null | undefined,
): VariantPricing {
  const retail = (variantRetail != null && variantRetail > 0)
    ? variantRetail
    : productRetail

  const wholesale = (variantWholesale != null && variantWholesale > 0)
    ? variantWholesale
    : (productWholesale != null && productWholesale > 0)
    ? productWholesale
    : null

  return { retail, wholesale }
}

/**
 * Resolve the actual unit price to charge given the current pricing mode.
 *
 * @param pricing     Result of resolveVariantPricing
 * @param isWholesale Whether the sale is in wholesale mode
 */
export function resolveUnitPrice(
  pricing: VariantPricing,
  isWholesale: boolean,
): number {
  if (isWholesale && pricing.wholesale != null && pricing.wholesale > 0) {
    return pricing.wholesale
  }
  return pricing.retail
}

/**
 * Convenience: resolve directly from raw values without building a VariantPricing
 * object first. Used in the cart recalculation effect.
 */
export function resolveUnitPriceDirect(
  productRetail: number,
  productWholesale: number | null | undefined,
  variantRetail: number | null | undefined,
  variantWholesale: number | null | undefined,
  isWholesale: boolean,
): number {
  const pricing = resolveVariantPricing(
    productRetail,
    productWholesale,
    variantRetail,
    variantWholesale,
  )
  return resolveUnitPrice(pricing, isWholesale)
}
