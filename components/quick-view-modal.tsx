'use client'

import { useState, useEffect } from 'react'
import { X, Star, ShoppingCart, Heart, Plus, Minus, Check, Truck, Shield, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCartStore } from '@/lib/cart-store'
import { useToast } from '@/components/ui/custom-toast'

interface Product {
  _id: string
  name: string
  description: string
  price: number
  oldPrice?: number
  rating: number
  reviews: number
  images: string[]
  inStock: boolean
  stockQuantity?: number
  category: string
  variants?: Array<{
    id: string
    type: string
    value: string
    price: number
    image: string
    stock: number
  }>
}

interface QuickViewModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string | null
}

export default function QuickViewModal({ isOpen, onClose, productId }: QuickViewModalProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  
  const { addItem } = useCartStore()
  const toast = useToast()

  useEffect(() => {
    if (isOpen && productId) {
      fetchProduct()
    }
  }, [isOpen, productId])

  const fetchProduct = async () => {
    if (!productId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/products/${productId}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data)
        setSelectedImage(0)
        setQuantity(1)
        setSelectedVariant(data.variants?.[0]?.id || null)
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Failed to load product details')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!product) return
    
    setIsAddingToCart(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const selectedVariantData = product.variants?.find(v => v.id === selectedVariant)
      const price = selectedVariantData?.price || product.price
      const image = selectedVariantData?.image || product.images[0]
      
      addItem({
        id: product._id,
        name: product.name,
        price: price,
        image: image,
        quantity: quantity,
        variant: selectedVariantData ? {
          id: selectedVariantData.id,
          type: selectedVariantData.type,
          value: selectedVariantData.value
        } : undefined
      })
      
      setJustAdded(true)
      toast.success(`${product.name} added to cart!`, `Quantity: ${quantity}`)
      
      setTimeout(() => setJustAdded(false), 2000)
      
    } catch (error) {
      toast.error('Failed to add item to cart')
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change
    const maxStock = selectedVariant 
      ? product?.variants?.find(v => v.id === selectedVariant)?.stock || 99
      : product?.stockQuantity || 99
    
    if (newQuantity >= 1 && newQuantity <= maxStock) {
      setQuantity(newQuantity)
    }
  }

  const getCurrentPrice = () => {
    if (!product) return 0
    const selectedVariantData = product.variants?.find(v => v.id === selectedVariant)
    return selectedVariantData?.price || product.price
  }

  const getCurrentStock = () => {
    if (!product) return 0
    const selectedVariantData = product.variants?.find(v => v.id === selectedVariant)
    return selectedVariantData?.stock || product.stockQuantity || 0
  }

  const isInStock = getCurrentStock() > 0

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Product Quick View</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : product ? (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={product.images[selectedImage] || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                        selectedImage === index ? 'border-primary' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
                <p className="text-gray-600">{product.description}</p>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {Array(5).fill(0).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {product.rating} ({product.reviews} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-primary">
                  KSH {getCurrentPrice().toLocaleString()}
                </span>
                {product.oldPrice && (
                  <span className="text-xl line-through text-gray-500">
                    KSH {product.oldPrice.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Variants */}
              {product.variants && product.variants.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Options:</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant.id)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          selectedVariant === variant.id
                            ? 'border-primary bg-primary text-white'
                            : 'border-gray-300 hover:border-primary'
                        }`}
                      >
                        {variant.value}
                        {variant.price !== product.price && (
                          <span className="ml-1 text-xs">
                            (+KSH {(variant.price - product.price).toLocaleString()})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Status */}
              <div className="flex items-center justify-between">
                <p className={`font-medium ${
                  isInStock ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isInStock ? (
                    getCurrentStock() <= 5 ? 
                      `Only ${getCurrentStock()} left!` : 
                      'In Stock'
                  ) : 'Out of Stock'}
                </p>
                {getCurrentStock() <= 5 && isInStock && (
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                    Low Stock
                  </span>
                )}
              </div>

              {/* Quantity and Add to Cart */}
              {isInStock && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="font-medium">Quantity:</span>
                    <div className="flex items-center gap-1 border rounded-lg">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="px-4 text-lg font-medium min-w-[3rem] text-center">
                        {quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= getCurrentStock()}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleAddToCart}
                      disabled={isAddingToCart}
                      className={`flex-1 h-12 text-lg transition-all duration-300 ${
                        justAdded 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-primary hover:bg-primary/90'
                      } text-white`}
                    >
                      {isAddingToCart ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                          Adding...
                        </>
                      ) : justAdded ? (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          Added to Cart!
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12"
                      onClick={() => setIsFavorite(!isFavorite)}
                    >
                      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t">
                <div className="text-center">
                  <Truck className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs font-medium">Free Delivery</p>
                  <p className="text-xs text-gray-500">Within Nairobi</p>
                </div>
                <div className="text-center">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs font-medium">Warranty</p>
                  <p className="text-xs text-gray-500">Manufacturer</p>
                </div>
                <div className="text-center">
                  <RotateCcw className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs font-medium">Returns</p>
                  <p className="text-xs text-gray-500">7 Days</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Product not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}