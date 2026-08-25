'use client'

import { useState, useEffect } from 'react'
import { Star, ShoppingCart, Heart, Leaf } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Header from '@/components/header'
import Footer from '@/components/footer'
import ProductImageCarousel from '@/components/product-image-carousel'
import RelatedProducts from '@/components/related-products'
import ProductReviews from '@/components/product-reviews'
import RatingSystemActivator from '@/components/rating-system-activator'
import { IProduct } from '@/models/Product'
import { useCartStore } from '@/lib/cart-store'
import { useToast } from '@/components/ui/custom-toast'
import Link from 'next/link'

interface ProductPageClientProps {
  product: IProduct
  initialRating: number
  initialReviewCount: number
}

export default function ProductPageClient({ 
  product, 
  initialRating, 
  initialReviewCount 
}: ProductPageClientProps) {
  // Selection state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)

  // Reviews (start with server values, can be updated client-side)
  const [realRating, setRealRating] = useState(initialRating)
  const [realReviewCount, setRealReviewCount] = useState(initialReviewCount)

  const { addItem } = useCartStore()
  const toast = useToast()

  // Auto-select first size when product loads or image changes
  useEffect(() => {
    const sizes = effectiveSizes()
    if (sizes.length > 0) setSelectedSize(sizes[0])
    else setSelectedSize('')
  }, [selectedImageIndex])

  // ── Pricing helpers ─────────────────────────────────────────────────────────

  // Get the active image object
  const activeImage = () => (product?.images ?? [])[selectedImageIndex]

  // Resolve effective retail price: image override → product base
  const unitPrice = () => {
    const imgPrice = activeImage()?.price ?? product.price
    const wsPrice = activeImage()?.wholesalePrice ?? product.wholesalePrice
    const wsThreshold = activeImage()?.wholesaleThreshold ?? product.wholesaleThreshold
    const isWholesale = wsPrice && wsThreshold && quantity >= wsThreshold
    return isWholesale ? wsPrice : imgPrice
  }

  const totalPrice = () => unitPrice() * quantity

  const isWholesaleActive = () => {
    const wsPrice = activeImage()?.wholesalePrice ?? product.wholesalePrice
    const wsThreshold = activeImage()?.wholesaleThreshold ?? product.wholesaleThreshold
    return !!(wsPrice && wsThreshold && quantity >= wsThreshold)
  }

  // Resolve effective sizes: image override → product base
  const effectiveSizes = (): string[] => {
    return activeImage()?.sizes?.length ? activeImage()!.sizes! : (product.sizes ?? [])
  }

  // Resolve effective stock: image override → product total
  const effectiveStock = (): number => {
    return activeImage()?.stock ?? product.stockQuantity ?? 0
  }

  // Check if any stock exists across all branches
  const isInStock = (): boolean => {
    return effectiveStock() > 0
  }

  // ── Add to cart ─────────────────────────────────────────────────────────────

  const handleAddToCart = () => {
    const images = product.images || []

    // If product has sizes, a size must be selected
    if (effectiveSizes().length > 0 && !selectedSize) {
      toast.error('Please select a size')
      return
    }

    // Extract URL and identity from the IProductImage object
    const selectedImage = images[selectedImageIndex]
    const selectedImageUrl = selectedImage?.url ?? '/placeholder.svg'

    setAddingToCart(true)

    const wsPrice = activeImage()?.wholesalePrice ?? product.wholesalePrice
    const wsThreshold = activeImage()?.wholesaleThreshold ?? product.wholesaleThreshold

    addItem({
      id: product._id || '',
      slug: product.slug,
      name: product.name,
      price: unitPrice(),
      wholesalePrice: wsPrice,
      wholesaleThreshold: wsThreshold,
      image: selectedImageUrl,
      quantity,
      selectedSize: selectedSize || undefined,
      selectedImage: images.length > 1 ? selectedImageUrl : undefined,
      imageIndex: selectedImageIndex,
      sku: selectedImage?.sku,
      groupId: selectedImage?.groupId,
      branchId: (product as any).branchId?.toString() || undefined,
    })

    setTimeout(() => {
      setAddingToCart(false)
      const detail = [
        images.length > 1 ? `Design ${selectedImageIndex + 1}` : '',
        selectedSize,
      ].filter(Boolean).join(' · ')
      toast.success(`${product.name}${detail ? ` (${detail})` : ''} added to cart!`)
    }, 400)
  }

  const images = product.images || []
  const hasSizes = effectiveSizes().length > 0
  const hasMultipleImages = images.length > 1
  const stock = effectiveStock()
  const wsPrice = activeImage()?.wholesalePrice ?? product.wholesalePrice
  const wsThreshold = activeImage()?.wholesaleThreshold ?? product.wholesaleThreshold

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <div className="mb-8 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <Link href={`/category/${product.category.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-foreground">{product.category}</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        {/* Main grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">

          {/* ── Left: Image Carousel ── */}
          <ProductImageCarousel
            images={images}
            selectedImageIndex={selectedImageIndex}
            onImageChange={setSelectedImageIndex}
            basePrice={product.price}
          />

          {/* ── Right: Details ── */}
          <div>
            <div className="mb-6">

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1">
                  {Array(5).fill(0).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < Math.floor(realRating) ? 'fill-secondary text-secondary' : 'text-muted-foreground'}`}
                    />
                  ))}
                </div>
                <span className="font-semibold text-foreground">
                  {realRating > 0 ? realRating.toFixed(1) : 'No rating'}
                </span>
                <span className="text-muted-foreground">({realReviewCount} reviews)</span>
              </div>

              {/* Design selection hint */}
              {hasMultipleImages && (
                <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border text-sm text-muted-foreground">
                  👆 Scroll through the images above and tap the design you want
                  {selectedImageIndex >= 0 && (
                    <span className="ml-1 font-medium text-foreground">
                      — Design {selectedImageIndex + 1} selected
                    </span>
                  )}
                </div>
              )}

              {/* Size picker */}
              {hasSizes && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3 text-foreground">
                    Size:{' '}
                    {selectedSize && (
                      <span className="font-bold text-primary">{selectedSize}</span>
                    )}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {effectiveSizes().map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all
                          ${selectedSize === size
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border hover:border-primary/50 text-foreground'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="mb-6 space-y-3">
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-bold text-primary">
                    KSH {unitPrice().toLocaleString()}
                  </span>
                  {product.oldPrice && (
                    <>
                      <span className="text-2xl line-through text-muted-foreground">
                        KSH {product.oldPrice.toLocaleString()}
                      </span>
                      <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-bold">
                        Save {Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
                      </span>
                    </>
                  )}
                  {isWholesaleActive() && (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                      Wholesale Price! 🎉
                    </span>
                  )}
                </div>

                {wsPrice && wsThreshold && !isWholesaleActive() && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      💰 <strong>Bulk deal:</strong> Buy {wsThreshold}+ for KSH {wsPrice.toLocaleString()} each
                      — save {Math.round(((unitPrice() - wsPrice) / unitPrice()) * 100)}% per unit
                    </p>
                  </div>
                )}

                {isWholesaleActive() && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      🎉 <strong>Wholesale pricing active!</strong> You're saving KSH {((activeImage()?.price ?? product.price) - wsPrice! * quantity).toLocaleString()} on this order
                    </p>
                  </div>
                )}

                <div className="text-lg font-semibold">
                  Total: KSH {totalPrice().toLocaleString()}
                </div>
              </div>

              {/* Stock */}
              <div className="mb-6">
                <span className={`text-sm font-semibold ${isInStock() ? 'text-green-600' : 'text-destructive'}`}>
                  {isInStock() ? '✓ In Stock' : 'Out of Stock'}
                </span>
              </div>

              {/* Quantity */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3 text-foreground">Quantity</label>

                {/* Wholesale quick-pick buttons */}
                {wsThreshold && (
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {[1, Math.floor(wsThreshold / 2), wsThreshold, wsThreshold * 2]
                      .filter((n, i, arr) => arr.indexOf(n) === i) // dedupe
                      .map(n => (
                      <button
                        key={n}
                        onClick={() => setQuantity(n)}
                        className={`px-3 py-1 text-sm border rounded transition-all
                          ${quantity === n ? 'border-primary bg-primary/10 font-semibold' : 'border-border'}
                          ${n >= wsThreshold ? 'bg-green-50 border-green-300 text-green-800' : ''}
                        `}
                      >
                        {n}{n === wsThreshold ? ' (Wholesale)' : ''}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center border border-border rounded-lg w-fit">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 text-foreground hover:bg-muted">−</button>
                  <span className="px-6 py-2 font-semibold text-foreground border-l border-r border-border">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-2 text-foreground hover:bg-muted">+</button>
                </div>

                {/* Wholesale progress bar */}
                {wsPrice && wsThreshold && quantity < wsThreshold && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-800">
                        Add {wsThreshold - quantity} more for wholesale pricing
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((quantity / wsThreshold) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-blue-600 mt-1">
                      <span>{quantity} items</span>
                      <span>{wsThreshold} needed</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mb-6">
                <Button
                  onClick={handleAddToCart}
                  disabled={addingToCart || !isInStock()}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg font-semibold disabled:opacity-50"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {addingToCart ? 'Adding...' : !isInStock() ? 'Out of Stock' : 'Add to Cart'}
                </Button>

                <Button
                  onClick={() => setIsFavorite(!isFavorite)}
                  variant="outline"
                  className="w-full py-6 text-lg font-semibold"
                >
                  <Heart className={`w-5 h-5 mr-2 ${isFavorite ? 'fill-destructive text-destructive' : ''}`} />
                  {isFavorite ? 'Added to Favorites' : 'Add to Favorites'}
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
                <div className="text-center">
                  <Leaf className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">100% Natural</p>
                </div>
                <div className="text-center">
                  <ShoppingCart className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Free Shipping</p>
                </div>
                <div className="text-center">
                  <Star className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">30-Day Returns</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-card rounded-lg p-6 md:p-8 mb-12">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Description</h2>
              <p className="text-card-foreground leading-relaxed mb-6">{product.description}</p>

              {product.benefits && product.benefits.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Benefits</h3>
                  <ul className="space-y-3">
                    {product.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-3 text-card-foreground">
                        <span className="text-primary font-bold mt-1">✓</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            <div>
              {product.ingredients && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Ingredients</h3>
                  <p className="text-card-foreground text-sm leading-relaxed">{product.ingredients}</p>
                </div>
              )}
              {product.usage && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Usage Instructions</h3>
                  <p className="text-card-foreground text-sm leading-relaxed">{product.usage}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mb-12 space-y-6">
          <RatingSystemActivator productId={product._id || ''} productName={product.name} />
          <ProductReviews productId={product._id || ''} />
        </div>

        {/* Related Products */}
        <RelatedProducts currentProductId={product._id || ''} category={product.category} />

      </main>
      <Footer />
    </div>
  )
}
