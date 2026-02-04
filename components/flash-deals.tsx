'use client'

import { useState, useEffect } from 'react'
import { Zap, Clock, Flame, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { IProduct } from '@/models/Product'
import { getProductDisplayImage, getProductDisplayPrice } from '@/lib/product-utils'

interface FeaturedDeal {
  id: number
  name: string
  originalPrice: number
  salePrice: number
  discount: number
  image: string
  rating: number
  reviews: number
  inStock: boolean
  category: string
  slug: string
}

export default function FlashDealsSection() {
  const [timeLeft, setTimeLeft] = useState(3600)
  const [deals, setDeals] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)

  // Featured electronics deals when no database deals
  const featuredDeals: FeaturedDeal[] = [
    {
      id: 1,
      name: "Samsung 55\" 4K Smart TV",
      originalPrice: 89999,
      salePrice: 67499,
      discount: 25,
      image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600",
      rating: 4.8,
      reviews: 234,
      inStock: true,
      category: "Entertainment",
      slug: "samsung-55-4k-smart-tv"
    },
    {
      id: 2,
      name: "LG Inverter Refrigerator 345L",
      originalPrice: 72999,
      salePrice: 54749,
      discount: 25,
      image: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600",
      rating: 4.7,
      reviews: 189,
      inStock: true,
      category: "Home Appliances",
      slug: "lg-inverter-refrigerator-345l"
    },
    {
      id: 3,
      name: "iPhone 15 Pro 256GB",
      originalPrice: 149999,
      salePrice: 134999,
      discount: 10,
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600",
      rating: 4.9,
      reviews: 456,
      inStock: true,
      category: "Mobile & Tablets",
      slug: "iphone-15-pro-256gb"
    },
    {
      id: 4,
      name: "Sony WH-1000XM5 Headphones",
      originalPrice: 34999,
      salePrice: 24499,
      discount: 30,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
      rating: 4.8,
      reviews: 312,
      inStock: true,
      category: "Audio & Headphones",
      slug: "sony-wh-1000xm5-headphones"
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 3600))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchFlashDeals()
  }, [])

  const fetchFlashDeals = async () => {
    try {
      const response = await fetch('/api/products?flashDeals=true&limit=4')
      if (response.ok) {
        const data = await response.json()
        setDeals(data.products)
      }
    } catch (error) {
      console.error('Error fetching flash deals:', error)
    } finally {
      setLoading(false)
    }
  }

  const hours = Math.floor(timeLeft / 3600)
  const minutes = Math.floor((timeLeft % 3600) / 60)
  const seconds = timeLeft % 60

  const displayDeals: (IProduct | FeaturedDeal)[] = deals.length > 0 ? deals : featuredDeals

  return (
    <section className="py-8 md:py-12 px-4 md:px-8 bg-gradient-to-r from-red-50 to-orange-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground ">
              Flash Deals
            </h2>
          </div>
          
          {/* Compact Timer */}
          <div className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full text-sm">
            <Clock className="w-4 h-4" />
            <span>{String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
          </div>
        </div>

        {/* Deals Grid - Simplified */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? (
            // Loading skeleton
            Array(4).fill(0).map((_, index) => (
              <div key={index} className="bg-card rounded-xl overflow-hidden shadow-sm animate-pulse">
                <div className="bg-muted h-40" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-16" />
                </div>
              </div>
            ))
          ) : (
            displayDeals.slice(0, 4).map((deal) => {
              // Handle both database products and featured deals
              const isDbProduct = '_id' in deal
              const dealId = isDbProduct ? (deal as IProduct)._id : (deal as FeaturedDeal).id
              const dealName = deal.name
              const dealImage = isDbProduct ? getProductDisplayImage(deal as IProduct) : (deal as FeaturedDeal).image
              const dealSlug = isDbProduct ? (deal as IProduct)._id : (deal as FeaturedDeal).slug
              
              let dealPrice: number, dealOldPrice: number | undefined, dealDiscount: number
              if (isDbProduct) {
                const product = deal as IProduct
                const { price, oldPrice } = getProductDisplayPrice(product)
                dealPrice = price
                dealOldPrice = oldPrice
                dealDiscount = product.flashDealDiscount || 20
              } else {
                const featuredDeal = deal as FeaturedDeal
                dealPrice = featuredDeal.salePrice
                dealOldPrice = featuredDeal.originalPrice
                dealDiscount = featuredDeal.discount
              }

              return (
                <Link key={dealId} href={`/product/${dealSlug}`} className="group">
                  <div className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-border/50">
                    {/* Image */}
                    <div className="relative overflow-hidden bg-muted">
                      <img
                        src={dealImage}
                        alt={dealName}
                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Discount Badge */}
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
                        -{dealDiscount}%
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-sm text-card-foreground mb-2 line-clamp-2 leading-tight">
                        {dealName}
                      </h3>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-red-600">
                          KSH {dealPrice.toLocaleString()}
                        </span>
                        {dealOldPrice && (
                          <span className="text-sm line-through text-muted-foreground">
                            KSH {dealOldPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>

        {/* Simple Call to Action */}
        <div className="text-center">
          <Link href="/products">
            <Button className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg">
              View All Deals
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
