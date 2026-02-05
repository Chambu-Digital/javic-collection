'use client'

import { useState, useEffect, use } from 'react'
import { Star, ShoppingCart, Heart, Leaf } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Header from '@/components/header'
import Footer from '@/components/footer'
import ProductImageCarousel from '@/components/product-image-carousel'
import ProductVariations from '@/components/product-variations'
import RelatedProducts from '@/components/related-products'
import ProductReviews from '@/components/product-reviews'
import RatingSystemActivator from '@/components/rating-system-activator'
import { IProduct, IVariant } from '@/models/Product'
import { useCartStore } from '@/lib/cart-store'
import { getProductDisplayPrice, getProductDisplayImage, calculateVariantPricing } from '@/lib/product-utils'
import { useToast } from '@/components/ui/custom-toast'
import Link from 'next/link'

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<IVariant | null>(null)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [allImages, setAllImages] = useState<string[]>([])
  const [isFavorite, setIsFavorite] = useState(false)
  const [product, setProduct] = useState<IProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addingToCart, setAddingToCart] = useState(false)
  const [realRating, setRealRating] = useState(0)
  const [realReviewCount, setRealReviewCount] = useState(0)
  const { addItem } = useCartStore()
  const toast = useToast()

  useEffect(() => {
    fetchProduct()
    fetchRealReviewStats()
  }, [resolvedParams.id])

  useEffect(() => {
    if (product) {
      // Build combined image array and set default variant
      if (product.hasVariants && product.variants && product.variants.length > 0) {
        // Create combined image array from all variants
        const variantImages = product.variants
          .filter(v => v.isActive && v.image)
          .map(v => v.image)
        
        // Combine product images and variant images, removing duplicates
        const productImages = product.images || []
        const combinedImages = [...new Set([...productImages, ...variantImages])]
        setAllImages(combinedImages)
        
        // Set default variant selection (cheapest active variant)
        const activeVariants = product.variants.filter(v => v.isActive)
        if (activeVariants.length > 0) {
          const cheapestVariant = activeVariants.reduce((cheapest, current) => 
            current.price < cheapest.price ? current : cheapest
          )
          setSelectedVariant(cheapestVariant)
          
          // Set initial image to cheapest variant's image
          const variantImageIndex = combinedImages.findIndex(img => img === cheapestVariant.image)
          if (variantImageIndex !== -1) {
            setSelectedImageIndex(variantImageIndex)
          }
        }
      } else {
        // For simple products, use product images
        setAllImages(product.images || [])
        setSelectedImageIndex(0)
      }
    }
  }, [product])

  // Handle variant selection and update image
  const handleVariantChange = (variant: IVariant | null, size?: string) => {
    setSelectedVariant(variant)
    if (size) {
      setSelectedSize(size)
    }
    
    if (variant && variant.image) {
      // Find the index of the variant's image in the combined image array
      const imageIndex = allImages.findIndex(img => img === variant.image)
      if (imageIndex !== -1) {
        setSelectedImageIndex(imageIndex)
      }
    }
  }

  // Handle manual image selection (when user clicks on gallery)
  const handleImageChange = (index: number) => {
    setSelectedImageIndex(index)
    
    // If the selected image belongs to a variant, select that variant
    if (product?.hasVariants && product.variants) {
      const selectedImage = allImages[index]
      const matchingVariant = product.variants.find(v => v.image === selectedImage && v.isActive)
      if (matchingVariant && matchingVariant.id !== selectedVariant?.id) {
        setSelectedVariant(matchingVariant)
      }
    }
  }

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data)
      } else {
        setError('Product not found')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      setError('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const fetchRealReviewStats = async () => {
    try {
      const response = await fetch(`/api/reviews/stats?productId=${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setRealRating(data.averageRating || 0)
        setRealReviewCount(data.totalReviews || 0)
      }
    } catch (error) {
      console.error('Error fetching real review stats:', error)
    }
  }

  const handleAddToCart = () => {
    if (!product) return
    
    setAddingToCart(true)
    
    // Get current price and image based on variant selection or product defaults
    const currentPrice = selectedVariant ? selectedVariant.price : getProductDisplayPrice(product).price
    const currentImage = selectedVariant ? selectedVariant.image : getProductDisplayImage(product)
    const variantName = selectedVariant ? `${selectedVariant.color}${selectedSize ? ` - ${selectedSize}` : ''}` : undefined
    
    // Create cart item with wholesale pricing data
    const cartItem = {
      id: product._id || '',
      name: product.name,
      price: currentPrice,
      wholesalePrice: selectedVariant?.wholesalePrice || product.wholesalePrice,
      wholesaleThreshold: selectedVariant?.wholesaleThreshold || product.wholesaleThreshold,
      image: currentImage,
      quantity: quantity,
      selectedColor: selectedVariant?.color,
      selectedSize: selectedSize || undefined,
      variantId: selectedVariant?.id,
    }
    
    // Add to Zustand store
    addItem(cartItem)
    
    // Show success feedback
    setTimeout(() => {
      setAddingToCart(false)
      toast.success(`${product.name}${variantName ? ` (${variantName})` : ''} added to cart!`)
    }, 500)
  }

  // Get current stock based on variant selection
  const getCurrentStock = () => {
    if (selectedVariant) {
      return selectedVariant.stock
    }
    return product?.stockQuantity || 0
  }



  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-64 mb-8" />
            <div className="grid md:grid-cols-2 gap-8">
              <div className="h-96 bg-muted rounded" />
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-6 bg-muted rounded w-1/2" />
                <div className="h-12 bg-muted rounded w-1/3" />
                <div className="h-32 bg-muted rounded" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
            <p className="text-muted-foreground mb-8">The product you're looking for doesn't exist.</p>
            <Link href="/">
              <Button>Return Home</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

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

        {/* Product Main Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Left: Image Carousel */}
          <ProductImageCarousel 
            images={allImages}
            selectedImageIndex={selectedImageIndex}
            onImageChange={handleImageChange}
          />

          {/* Right: Product Details */}
          <div>
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(realRating)
                            ? 'fill-secondary text-secondary'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                </div>
                <span className="font-semibold text-foreground">
                  {realRating > 0 ? realRating.toFixed(1) : 'No rating'}
                </span>
                <span className="text-muted-foreground">
                  ({realReviewCount} reviews)
                </span>
              </div>

              {/* Variants */}
              {product.hasVariants && product.variants && product.variants.length > 0 && (
                <div className="mb-6">
                  <ProductVariations
                    variants={product.variants}
                    onVariantChange={handleVariantChange}
                    selectedVariantId={selectedVariant?.id}
                  />
                </div>
              )}

              {/* Dynamic Price Display */}
              <div className="mb-6">
                {selectedVariant ? (
                  (() => {
                    const pricing = calculateVariantPricing(selectedVariant, quantity)
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <span className="text-4xl font-bold text-primary">
                            KSH {pricing.unitPrice}
                          </span>
                          <span className="text-lg text-muted-foreground">each</span>
                          {pricing.isWholesale && (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                              Wholesale Price! 🎉
                            </span>
                          )}
                        </div>
                        
                        {pricing.hasWholesale && !pricing.isWholesale && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                              💰 <strong>Bulk Pricing Available:</strong> Buy {pricing.wholesaleThreshold}+ units for KSH {pricing.wholesalePrice} each 
                              (Save {Math.round(((selectedVariant.price - pricing.wholesalePrice) / selectedVariant.price) * 100)}% per unit)
                            </p>
                          </div>
                        )}
                        
                        {pricing.isWholesale && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-sm text-green-800">
                              🎉 <strong>You're saving KSH {pricing.savings.toFixed(2)}</strong> ({pricing.savingsPercentage}%) with wholesale pricing!
                            </p>
                          </div>
                        )}
                        
                        <div className="text-lg font-semibold">
                          Total: KSH {pricing.totalPrice.toFixed(2)}
                        </div>
                      </div>
                    )
                  })()
                ) : (
                  <div className="flex items-center gap-4">
                    <span className="text-4xl font-bold text-primary">
                      KSH {getProductDisplayPrice(product).price}
                    </span>
                    {getProductDisplayPrice(product).oldPrice && (
                      <>
                        <span className="text-2xl line-through text-muted-foreground">
                          KSH {getProductDisplayPrice(product).oldPrice}
                        </span>
                        <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-bold">
                          Save {Math.round(((getProductDisplayPrice(product).oldPrice! - getProductDisplayPrice(product).price) / getProductDisplayPrice(product).oldPrice!) * 100)}%
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                <span
                  className={`text-sm font-semibold ${
                    getCurrentStock() > 0
                      ? 'text-green-600'
                      : 'text-destructive'
                  }`}
                >
                  {getCurrentStock() > 0 ? `✓ ${getCurrentStock()} in Stock` : 'Out of Stock'}
                </span>
              </div>

              {/* Quantity */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3 text-foreground">
                  Quantity
                </label>
                
                {/* Quick Quantity Buttons */}
                {selectedVariant && selectedVariant.wholesaleThreshold && (
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setQuantity(1)}
                      className={`px-3 py-1 text-sm border rounded ${quantity === 1 ? 'border-primary bg-primary/10' : 'border-border'}`}
                    >
                      1
                    </button>
                    <button
                      onClick={() => setQuantity(Math.floor(selectedVariant.wholesaleThreshold! / 2))}
                      className={`px-3 py-1 text-sm border rounded ${quantity === Math.floor(selectedVariant.wholesaleThreshold! / 2) ? 'border-primary bg-primary/10' : 'border-border'}`}
                    >
                      {Math.floor(selectedVariant.wholesaleThreshold! / 2)}
                    </button>
                    <button
                      onClick={() => setQuantity(selectedVariant.wholesaleThreshold!)}
                      className={`px-3 py-1 text-sm border rounded bg-green-50 border-green-300 text-green-800 font-medium ${quantity === selectedVariant.wholesaleThreshold! ? 'ring-2 ring-green-300' : ''}`}
                    >
                      {selectedVariant.wholesaleThreshold!} (Wholesale)
                    </button>
                    <button
                      onClick={() => setQuantity(selectedVariant.wholesaleThreshold! * 2)}
                      className={`px-3 py-1 text-sm border rounded bg-green-50 border-green-300 text-green-800 ${quantity === selectedVariant.wholesaleThreshold! * 2 ? 'ring-2 ring-green-300' : ''}`}
                    >
                      {selectedVariant.wholesaleThreshold! * 2}
                    </button>
                  </div>
                )}
                
                <div className="flex items-center border border-border rounded-lg w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 text-foreground hover:bg-muted"
                  >
                    −
                  </button>
                  <span className="px-6 py-2 font-semibold text-foreground border-l border-r border-border">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 text-foreground hover:bg-muted"
                  >
                    +
                  </button>
                </div>

                {/* Wholesale Progress Bar */}
                {selectedVariant && selectedVariant.wholesaleThreshold && quantity < selectedVariant.wholesaleThreshold && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-800">
                        Add {selectedVariant.wholesaleThreshold - quantity} more for wholesale pricing
                      </span>
                      <span className="text-sm text-blue-600">
                        Save KSH {((selectedVariant.price - selectedVariant.wholesalePrice!) * selectedVariant.wholesaleThreshold).toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((quantity / selectedVariant.wholesaleThreshold) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-blue-600 mt-1">
                      <span>{quantity} items</span>
                      <span>{selectedVariant.wholesaleThreshold} needed</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mb-6">
                <Button
                  onClick={handleAddToCart}
                  disabled={addingToCart || getCurrentStock() === 0}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg font-semibold disabled:opacity-50"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {addingToCart ? 'Adding...' : getCurrentStock() === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>

                <Button
                  onClick={() => setIsFavorite(!isFavorite)}
                  variant="outline"
                  className="w-full py-6 text-lg font-semibold"
                >
                  <Heart
                    className={`w-5 h-5 mr-2 ${
                      isFavorite ? 'fill-destructive text-destructive' : ''
                    }`}
                  />
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

        {/* Product Information Tabs */}
        <div className="bg-card rounded-lg p-6 md:p-8 mb-12">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Description</h2>
              <p className="text-card-foreground leading-relaxed mb-6">
                {product.description}
              </p>
              
              {product.benefits && product.benefits.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Benefits</h3>
                  <ul className="space-y-3">
                    {product.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-3 text-card-foreground">
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
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Ingredients
                  </h3>
                  <p className="text-card-foreground text-sm leading-relaxed">
                    {product.ingredients}
                  </p>
                </div>
              )}

              {product.usage && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Usage Instructions
                  </h3>
                  <p className="text-card-foreground text-sm leading-relaxed">
                    {product.usage}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Reviews */}
        {product && (
          <div className="mb-12 space-y-6">
            {/* Rating System Activator */}
            <RatingSystemActivator 
              productId={product._id || ''}
              productName={product.name}
            />
            
            {/* Reviews Display */}
            <ProductReviews 
              productId={product._id || ''}
            />
          </div>
        )}

        {/* Related Products */}
        {product && (
          <RelatedProducts 
            currentProductId={product._id || ''} 
            category={product.category} 
          />
        )}
      </main>

      <Footer />
    </div>
  )
}