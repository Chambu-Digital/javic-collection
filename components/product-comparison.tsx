'use client'

import { useState, useEffect } from 'react'
import { X, Star, ShoppingCart, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCartStore } from '@/lib/cart-store'
import { useToast } from '@/components/ui/custom-toast'

interface Product {
  _id: string
  name: string
  price: number
  oldPrice?: number
  rating: number
  reviews: number
  images: string[]
  category: string
  description: string
  inStock: boolean
  stockQuantity?: number
}

interface ProductComparisonProps {
  isOpen: boolean
  onClose: () => void
  productIds: string[]
}

export default function ProductComparison({ isOpen, onClose, productIds }: ProductComparisonProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const { addItem } = useCartStore()
  const toast = useToast()

  useEffect(() => {
    if (isOpen && productIds.length > 0) {
      fetchProducts()
    }
  }, [isOpen, productIds])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const promises = productIds.map(id => 
        fetch(`/api/products/${id}`).then(res => res.json())
      )
      const results = await Promise.all(promises)
      setProducts(results.filter(product => product._id))
    } catch (error) {
      console.error('Error fetching products for comparison:', error)
      toast.error('Failed to load products for comparison')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (product: Product) => {
    try {
      addItem({
        id: product._id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        quantity: 1
      })
      
      toast.success(`${product.name} added to cart!`)
    } catch (error) {
      toast.error('Failed to add item to cart')
    }
  }

  const getDiscountPercentage = (product: Product) => {
    if (!product.oldPrice) return 0
    return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Product Comparison
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <td className="p-4 font-semibold">Product</td>
                  {products.map((product) => (
                    <td key={product._id} className="p-4 text-center min-w-[250px]">
                      <div className="space-y-3">
                        <img
                          src={product.images[0] || '/placeholder.svg'}
                          alt={product.name}
                          className="w-32 h-32 object-cover rounded-lg mx-auto"
                        />
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                      </div>
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {/* Price Row */}
                <tr>
                  <td className="p-4 font-semibold">Price</td>
                  {products.map((product) => (
                    <td key={product._id} className="p-4 text-center">
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-primary">
                          KSH {product.price.toLocaleString()}
                        </div>
                        {product.oldPrice && (
                          <div className="text-sm text-gray-500 line-through">
                            KSH {product.oldPrice.toLocaleString()}
                          </div>
                        )}
                        {getDiscountPercentage(product) > 0 && (
                          <div className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full inline-block">
                            -{getDiscountPercentage(product)}% OFF
                          </div>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Rating Row */}
                <tr>
                  <td className="p-4 font-semibold">Rating</td>
                  {products.map((product) => (
                    <td key={product._id} className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex items-center gap-1">
                          {Array(5).fill(0).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(product.rating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {product.rating} ({product.reviews})
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Category Row */}
                <tr>
                  <td className="p-4 font-semibold">Category</td>
                  {products.map((product) => (
                    <td key={product._id} className="p-4 text-center">
                      <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                        {product.category}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Stock Row */}
                <tr>
                  <td className="p-4 font-semibold">Availability</td>
                  {products.map((product) => (
                    <td key={product._id} className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        product.inStock 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                      {product.stockQuantity && product.stockQuantity <= 5 && product.inStock && (
                        <div className="text-xs text-orange-600 mt-1">
                          Only {product.stockQuantity} left
                        </div>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Description Row */}
                <tr>
                  <td className="p-4 font-semibold">Description</td>
                  {products.map((product) => (
                    <td key={product._id} className="p-4 text-center">
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {product.description}
                      </p>
                    </td>
                  ))}
                </tr>

                {/* Action Row */}
                <tr>
                  <td className="p-4 font-semibold">Action</td>
                  {products.map((product) => (
                    <td key={product._id} className="p-4 text-center">
                      <div className="space-y-2">
                        <Button
                          onClick={() => handleAddToCart(product)}
                          disabled={!product.inStock}
                          className="w-full bg-primary hover:bg-primary/90 text-white"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            onClose()
                            window.location.href = `/product/${product._id}`
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No products to compare</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}