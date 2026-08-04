import { IProduct, IProductImage } from '@/models/Product'

export interface ExcelRow {
  itemCode: string
  itemName: string
  category: string
  colour: string
  imageUrl: string
  sizes: string
  sizeStock: string
  retailPrice: number
  oldPrice: number | null
  stockQuantity: number
  wholesalePrice: number | null
  wholesaleThreshold: number | null
  description: string
  tags: string
}

/**
 * Generates a SKU for a product that doesn't have one
 * Based on product slug or name, converted to uppercase with hyphens
 */
export function generateSKU(slug: string, name: string): string {
  const base = slug || name
  const sku = base
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .toUpperCase()
  
  return sku
}

/**
 * Ensures a SKU is unique by appending a number if needed
 * This should be called with existing SKUs from the database
 */
export function ensureUniqueSKU(
  proposedSKU: string,
  existingSKUs: string[],
  currentProductSKU?: string
): string {
  // If the product already has this SKU, keep it
  if (currentProductSKU && currentProductSKU === proposedSKU) {
    return proposedSKU
  }
  
  // If the SKU is not taken, use it
  if (!existingSKUs.includes(proposedSKU)) {
    return proposedSKU
  }
  
  // Generate a unique SKU by appending a number
  let counter = 2
  let uniqueSKU = `${proposedSKU}-${counter}`
  
  while (existingSKUs.includes(uniqueSKU)) {
    counter++
    uniqueSKU = `${proposedSKU}-${counter}`
  }
  
  return uniqueSKU
}

/**
 * Calculates stock for an image based on the hierarchy:
 * 1. Size Stock (if exists) → sum of all size quantities
 * 2. Image Stock (if exists and no size stock)
 * 3. Product Stock (legacy fallback)
 */
export function calculateImageStock(
  image: any,
  productStockQuantity: number
): number {
  // Priority 1: Calculate from sizeStock
  if (image.sizeStock && Object.keys(image.sizeStock).length > 0) {
    const sizeStockValues = Object.values(image.sizeStock)
    return sizeStockValues.reduce((total: number, qty: any) => total + (qty || 0), 0)
  }
  
  // Priority 2: Use image stock if it exists
  if (image.stock !== undefined && image.stock !== null) {
    return image.stock
  }
  
  // Priority 3: Legacy product-level stock (only for first image if no image stock)
  return productStockQuantity
}

/**
 * Formats sizeStock object into Excel-friendly string
 * Example: { S: 5, M: 3, L: 2 } → "S:5, M:3, L:2"
 * Handles both plain objects and Mongoose Maps
 */
export function formatSizeStock(sizeStock?: any): string {
  if (!sizeStock) {
    return ''
  }
  
  // Handle Mongoose Map
  if (sizeStock instanceof Map) {
    const entries = Array.from(sizeStock.entries())
    if (entries.length === 0) return ''
    return entries.map(([size, qty]) => `${size}:${qty}`).join(', ')
  }
  
  // Handle plain object
  const keys = Object.keys(sizeStock)
  if (keys.length === 0) return ''
  
  return keys.map(size => `${size}:${sizeStock[size]}`).join(', ')
}

/**
 * Normalizes sizes array to a comma-separated string
 * Removes duplicates and trims spaces
 */
export function formatSizes(sizes?: string[]): string {
  if (!sizes || sizes.length === 0) {
    return ''
  }
  
  // Remove duplicates and trim
  const uniqueSizes = Array.from(new Set(sizes.map(s => s.trim())))
  return uniqueSizes.join(',')
}

/**
 * Formats tags array to comma-separated string
 */
export function formatTags(tags?: string[]): string {
  if (!tags || tags.length === 0) {
    return ''
  }
  
  return tags.map(t => t.trim()).join(',')
}

/**
 * Gets the SKU for a product
 * Checks product.sku first, then images for SKU, then generates if needed
 */
export function getProductSKU(product: IProduct, existingSKUs: string[]): string {
  // Priority 1: Use product-level SKU if it exists
  if (product.sku) {
    return product.sku
  }
  
  // Priority 2: Check if any image has a SKU
  const imageWithSKU = product.images.find(img => img.sku)
  if (imageWithSKU?.sku) {
    return imageWithSKU.sku
  }
  
  // Priority 3: Generate SKU from slug or name
  const proposedSKU = generateSKU(product.slug, product.name)
  
  // Ensure uniqueness
  return ensureUniqueSKU(proposedSKU, existingSKUs, product.sku)
}

/**
 * Generates Excel rows for a product with parent/continuation structure
 * First row is parent (contains all product info)
 * Subsequent rows are continuations (only image-specific info)
 */
export function generateProductRows(product: any, existingSKUs: string[]): ExcelRow[] {
  const rows: ExcelRow[] = []
  const sku = getProductSKU(product, existingSKUs)
  
  if (!product.images || product.images.length === 0) {
    // Product without images - single parent row
    rows.push({
      itemCode: sku,
      itemName: product.name || '',
      category: product.category || '',
      colour: '',
      imageUrl: '',
      sizes: formatSizes(product.sizes),
      sizeStock: '',
      retailPrice: product.price || 0,
      oldPrice: product.oldPrice || null,
      stockQuantity: product.stockQuantity || 0,
      wholesalePrice: product.wholesalePrice || null,
      wholesaleThreshold: product.wholesaleThreshold || null,
      description: product.description || '',
      tags: formatTags(product.tags),
    })
    return rows
  }
  
  // Product with images - parent row + continuation rows
  product.images.forEach((image: any, index: number) => {
    const isFirstImage = index === 0
    const imageStock = calculateImageStock(image, product.stockQuantity || 0)
    
    rows.push({
      itemCode: isFirstImage ? sku : '',
      itemName: isFirstImage ? (product.name || '') : '',
      category: isFirstImage ? (product.category || '') : '',
      colour: '', // Could use groupId or other identifier if available
      imageUrl: image.url || '',
      sizes: formatSizes(image.sizes || product.sizes),
      sizeStock: formatSizeStock(image.sizeStock),
      retailPrice: isFirstImage ? (product.price || 0) : 0,
      oldPrice: isFirstImage ? (product.oldPrice || null) : null,
      stockQuantity: imageStock,
      wholesalePrice: isFirstImage ? (product.wholesalePrice || null) : null,
      wholesaleThreshold: isFirstImage ? (product.wholesaleThreshold || null) : null,
      description: isFirstImage ? (product.description || '') : '',
      tags: isFirstImage ? formatTags(product.tags) : '',
    })
  })
  
  return rows
}

/**
 * Generates all Excel rows for a list of products
 * Collects all existing SKUs first for uniqueness checking
 */
export function generateAllExcelRows(products: any[]): ExcelRow[] {
  // Collect existing SKUs from all products (from images)
  const existingSKUs: string[] = []
  products.forEach(product => {
    if (product.sku) existingSKUs.push(product.sku)
    if (product.images) {
      product.images.forEach((image: any) => {
        if (image.sku) existingSKUs.push(image.sku)
      })
    }
  })
  
  // Generate rows for each product
  const allRows: ExcelRow[] = []
  products.forEach(product => {
    const productRows = generateProductRows(product, existingSKUs)
    allRows.push(...productRows)
  })
  
  return allRows
}
