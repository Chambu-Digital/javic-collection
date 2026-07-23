import { IProduct, IProductImage } from '@/models/Product'

export interface PosVariantInfo {
  imageIndex: number
  image: IProductImage
  retailPrice: number
  wholesalePrice?: number
  wholesaleThreshold?: number
  stock: number
  sizes: string[]
  sku?: string
  inStock: boolean
}

export function getVariantInfo(product: IProduct, imageIndex: number, selectedSize?: string): PosVariantInfo {
  const image = product.images?.[imageIndex]
  const retailPrice = image?.price ?? product.price
  const wholesalePrice = image?.wholesalePrice ?? product.wholesalePrice
  const wholesaleThreshold = image?.wholesaleThreshold ?? product.wholesaleThreshold

  // Resolve sizes — prefer sizeStock keys, then image.sizes, then product.sizes
  const sizeStockMap = image?.sizeStock as Record<string, number> | undefined
  const sizes = sizeStockMap && Object.keys(sizeStockMap).length > 0
    ? Object.keys(sizeStockMap)
    : image?.sizes?.length
    ? image.sizes
    : (product.sizes ?? [])

  // Resolve stock — if we have a selected size and a sizeStock map, use the per-size qty
  let stock: number
  if (selectedSize && sizeStockMap && selectedSize in sizeStockMap) {
    stock = sizeStockMap[selectedSize] ?? 0
  } else if (image?.stock != null) {
    stock = image.stock
  } else {
    stock = product.stockQuantity ?? 0
  }

  return {
    imageIndex,
    image: image || { url: '/placeholder.svg' },
    retailPrice,
    wholesalePrice,
    wholesaleThreshold,
    stock,
    sizes,
    sku: image?.sku,
    inStock: stock > 0 && product.inStock,
  }
}

export function getAllVariants(product: IProduct): PosVariantInfo[] {
  if (!product.images?.length) {
    return [getVariantInfo(product, 0)]
  }
  return product.images.map((_, i) => getVariantInfo(product, i))
}

export function resolveUnitPrice(
  variant: PosVariantInfo,
  pricingMode: 'retail' | 'wholesale',
  quantity: number
): { unitPrice: number; isWholesale: boolean; hasWholesale: boolean } {
  const hasWholesale = !!(variant.wholesalePrice && variant.wholesalePrice > 0)
  const autoWholesale =
    hasWholesale &&
    variant.wholesaleThreshold &&
    quantity >= variant.wholesaleThreshold

  const useWholesale =
    pricingMode === 'wholesale' || (pricingMode === 'retail' && autoWholesale)

  if (useWholesale && hasWholesale) {
    return {
      unitPrice: variant.wholesalePrice!,
      isWholesale: true,
      hasWholesale: true,
    }
  }

  return {
    unitPrice: variant.retailPrice,
    isWholesale: false,
    hasWholesale,
  }
}

export function getProductSearchStock(product: IProduct): number {
  if (product.images?.length) {
    const variantStock = product.images.reduce(
      (sum, img) => sum + (img.stock ?? 0),
      0
    )
    if (variantStock > 0) return variantStock
  }
  return product.stockQuantity ?? 0
}

export function isProductAvailable(product: IProduct): boolean {
  if (!product.isActive || !product.inStock) return false
  return getProductSearchStock(product) > 0
}
