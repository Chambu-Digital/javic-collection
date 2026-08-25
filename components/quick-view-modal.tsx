'use client'

import { useState, useEffect } from 'react'
import { Star, ShoppingCart, Heart, Plus, Minus, Check, Truck, Shield, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCartStore } from '@/lib/cart-store'
import { useToast } from '@/components/ui/custom-toast'
import { IProductImage } from '@/models/Product'

// Local product shape aligned with the new image-based architecture
interface Product {
  _id: string
  slug: string
  name: string
  description: string
  price: number
  oldPrice?: number
  wholesalePrice?: number
  wholesaleThreshold?: number
  rating: number
  reviews: number
  images: IProductImage[]   // IProductImage[] — {url, price?}
  sizes: string[]           // flat size list
  inStock: boolean
  stockQuantity?: number
  category: string
}

interface QuickViewModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string | null
}

export default function QuickViewModal({ isOpen, onClose, productId }: QuickViewModalProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const { addItem } = useCartStore()
  const toast = useToast()

  useEffect(() => {
    if (isOpen && productId) fetchProduct()
  }, [isOpen, productId])

  // Auto-select first size when product loads
  useEffect(() => {
    if (product?.sizes?.length) setSelectedSize(product.sizes[0])
  }, [product])

  const fetchProduct = async () => {
    if (!productId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/products/${productId}`)
      if (res.ok) {
        const data = await res.json()
        // Normalise legacy string[] images → IProductImage[]
        const images: IProductImage[] = (data.images || []).map((img: any) =>
          typeof img === 'string' ? { url: img } : img
        )
        setProduct({ ...data, images })
        setSelectedImageIndex(0)
        setQuantity(1)
      }
    } catch {
      toast.error('Failed to load product details')
    } finally {
      setLoading(false)
    }
  }

  // Resolve the effective price for the currently selected image
  const effectivePrice = () => {
    if (!product) return 0
    const imgPrice = product.images[selectedImageIndex]?.price
    const isWholesale = product.wholesalePrice && product.wholesaleThreshold && quantity >= product.wholesaleThreshold
    if (isWholesale) return product.wholesalePrice!
    return imgPrice ?? product.price
  }

  // Price range across all images (for the header display before selection)
  const priceRange = () => {
    if (!product) return { min: 0, max: 0, hasDiff: false }
    const prices = product.images.map(img => img.price ?? product.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    return { min, max, hasDiff: min !== max }
  }

  const handleAddToCart = async () => {
    if (!product) return
    setIsAddingToCart(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 400))

      const selectedImage = product.images[selectedImageIndex]?.url
      const price = effectivePrice()

      addItem({
        id: product._id,
        slug: product.slug,
        name: product.name,
        price,
        wholesalePrice: product.wholesalePrice,
        wholesaleThreshold: product.wholesaleThreshold,
        image: selectedImage || '/placeholder.svg',
        quantity,
        selectedSize: selectedSize || undefined,
        selectedImage: product.images.length > 1 ? selectedImage : undefined,
        imageIndex: selectedImageIndex
      })

      setJustAdded(true)
      toast.success(`${product.name} added to cart!`, `Quantity: ${quantity}`)
      setTimeout(() => setJustAdded(false), 2000)
    } catch {
      toast.error('Failed to add item to cart')
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleQuantityChange = (change: number) => {
    const next = quantity + change
    const max = product?.stockQuantity || 99
    if (next >= 1 && next <= max) setQuantity(next)
  }

  const stock = product?.stockQuantity || 0
  const isInStock = stock > 0
  const range = priceRange()

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Product Quick View</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : product ? (
          <div className="grid md:grid-cols-2 gap-8">

            {/* ── Images ── */}
            <div className="space-y-4">
              <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 relative">
                <img
                  src={product.images[selectedImageIndex]?.url || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {/* Per-image price badge */}
                {product.images[selectedImageIndex]?.price != null && (
                  <div className="absolute bottom-3 right-3 bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full shadow">
                    KSH {product.images[selectedImageIndex].price!.toLocaleString()}
                  </div>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImageIndex(i)}
                      className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                        selectedImageIndex === i ? 'border-primary' : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <img src={img.url || '/placeholder.svg'} alt={`Design ${i + 1}`} className="w-full h-full object-cover" />
                      {img.price != null && (
                        <div className="absolute bottom-0 inset-x-0 bg-primary/80 text-white text-[9px] text-center py-0.5 font-semibold">
                          {img.price.toLocaleString()}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Details ── */}
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
                <p className="text-gray-600 text-sm">{product.description}</p>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {Array(5).fill(0).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <span className="text-sm text-gray-600">{product.rating} ({product.reviews} reviews)</span>
              </div>

              {/* Price */}
              <div>
                {range.hasDiff && selectedImageIndex === 0 ? (
                  // Show range before user picks an image
                  <p className="text-3xl font-bold text-primary">
                    KSH {range.min.toLocaleString()} – {range.max.toLocaleString()}
                  </p>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-primary">KSH {effectivePrice().toLocaleString()}</span>
                    {product.oldPrice && (
                      <span className="text-xl line-through text-gray-400">KSH {product.oldPrice.toLocaleString()}</span>
                    )}
                  </div>
                )}
                {product.wholesalePrice && product.wholesaleThreshold && (
                  <p className="text-xs text-blue-700 mt-1">
                    💰 Buy {product.wholesaleThreshold}+ for KSH {product.wholesalePrice.toLocaleString()} each
                  </p>
                )}
              </div>

              {/* Design selection hint */}
              {product.images.length > 1 && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border">
                  👆 Select a design image above — price updates if this design has a different price
                  {selectedImageIndex > 0 && <span className="font-medium text-foreground"> — Design {selectedImageIndex + 1} selected</span>}
                </p>
              )}

              {/* Sizes */}
              {product.sizes?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">
                    Size: {selectedSize && <span className="text-primary font-bold">{selectedSize}</span>}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map(size => (
                      <button key={size} onClick={() => setSelectedSize(size)}
                        className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition-all ${
                          selectedSize === size
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border hover:border-primary/50'
                        }`}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock */}
              <p className={`text-sm font-medium ${isInStock ? 'text-green-600' : 'text-red-600'}`}>
                {isInStock ? (stock <= 5 ? `Only ${stock} left!` : '✓ In Stock') : 'Out of Stock'}
              </p>

              {/* Qty + Add to cart */}
              {isInStock && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">Quantity:</span>
                    <div className="flex items-center gap-1 border rounded-lg">
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="px-4 font-medium min-w-[2.5rem] text-center">{quantity}</span>
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleQuantityChange(1)} disabled={quantity >= stock}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleAddToCart} disabled={isAddingToCart}
                      className={`flex-1 h-12 text-base transition-all ${justAdded ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary/90'} text-white`}>
                      {isAddingToCart ? (
                        <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />Adding...</>
                      ) : justAdded ? (
                        <><Check className="w-5 h-5 mr-2" />Added!</>
                      ) : (
                        <><ShoppingCart className="w-5 h-5 mr-2" />Add to Cart</>
                      )}
                    </Button>
                    <Button variant="outline" size="icon" className="h-12 w-12" onClick={() => setIsFavorite(!isFavorite)}>
                      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                  </div>
                </div>
              )}

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center"><Truck className="w-5 h-5 mx-auto mb-1 text-primary" /><p className="text-xs font-medium">Free Delivery</p><p className="text-xs text-gray-500">Within Nairobi</p></div>
                <div className="text-center"><Shield className="w-5 h-5 mx-auto mb-1 text-primary" /><p className="text-xs font-medium">Warranty</p><p className="text-xs text-gray-500">Manufacturer</p></div>
                <div className="text-center"><RotateCcw className="w-5 h-5 mx-auto mb-1 text-primary" /><p className="text-xs font-medium">Returns</p><p className="text-xs text-gray-500">7 Days</p></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12"><p className="text-gray-500">Product not found</p></div>
        )}
      </DialogContent>
    </Dialog>
  )
}
