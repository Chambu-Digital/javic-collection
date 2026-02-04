'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Star } from 'lucide-react'

interface ReviewStats {
  totalReviews: number
  averageRating: number
  ratingDistribution: { [key: number]: number }
  recentReviews: Array<{
    _id: string
    rating: number
    title: string
    comment: string
    createdAt: string
    productId: {
      _id: string
      name: string
      images: string[]
    }
    userId: {
      _id: string
      firstName: string
      lastName: string
    }
  }>
}

export default function ReviewStatsSection() {
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Featured testimonials when no database reviews
  const featuredTestimonials = [
    {
      id: 1,
      rating: 5,
      title: "Outstanding Service & Quality Products",
      comment: "I bought a Samsung refrigerator from ELECTROMATT and the experience was fantastic. The team helped me choose the perfect size for my kitchen, and the delivery was prompt. The fridge has been working perfectly for 6 months now!",
      customerName: "Sarah M.",
      productName: "Samsung Double Door Refrigerator",
      date: "2 weeks ago",
      verified: true,
      location: "Nairobi"
    },
    {
      id: 2,
      rating: 5,
      title: "Best Electronics Store in Town",
      comment: "ELECTROMATT has the best prices and genuine products. I've bought my TV, microwave, and blender from them. Their after-sales service is excellent, and they always follow up to ensure everything is working well.",
      customerName: "John K.",
      productName: "LG Smart TV 55 inch",
      date: "1 month ago",
      verified: true,
      location: "Mombasa"
    },
    {
      id: 3,
      rating: 5,
      title: "Reliable and Trustworthy",
      comment: "I was skeptical about buying electronics online, but ELECTROMATT exceeded my expectations. The smartphone I ordered arrived in perfect condition with all accessories. Their customer support team is very responsive and helpful.",
      customerName: "Grace W.",
      productName: "iPhone 15 Pro",
      date: "3 weeks ago",
      verified: true,
      location: "Kisumu"
    },
    {
      id: 4,
      rating: 5,
      title: "Professional Installation Service",
      comment: "Not only do they sell quality appliances, but their installation service is top-notch. The technicians were professional, clean, and explained everything clearly. My new washing machine works perfectly!",
      customerName: "David O.",
      productName: "LG Front Load Washing Machine",
      date: "1 week ago",
      verified: true,
      location: "Eldoret"
    },
    {
      id: 5,
      rating: 5,
      title: "Great Value for Money",
      comment: "ELECTROMATT offers competitive prices without compromising on quality. I compared prices from multiple stores, and they had the best deal. Plus, their warranty service is reliable and hassle-free.",
      customerName: "Mary N.",
      productName: "Philips Air Fryer",
      date: "2 months ago",
      verified: true,
      location: "Nakuru"
    },
    {
      id: 6,
      rating: 5,
      title: "Excellent Customer Experience",
      comment: "From browsing their website to receiving my order, everything was smooth. The product descriptions are accurate, and the delivery was faster than expected. I'll definitely shop here again!",
      customerName: "Peter M.",
      productName: "Sony Bluetooth Headphones",
      date: "3 days ago",
      verified: true,
      location: "Thika"
    }
  ]

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/reviews/public-stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching review stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    }
    
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${sizeClasses[size]} ${
          i < Math.floor(rating) 
            ? 'fill-yellow-400 text-yellow-400' 
            : i < rating 
            ? 'fill-yellow-200 text-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ))
  }

  if (loading) {
    return (
      <section className="py-8 md:py-12 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="h-8 bg-muted animate-pulse rounded w-80 mx-auto mb-3"></div>
            <div className="h-5 bg-muted animate-pulse rounded w-96 mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-32 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    )
  }

  const displayReviews = (stats?.recentReviews?.length || 0) > 0 ? (stats?.recentReviews || []) : featuredTestimonials
  const totalReviews = stats?.totalReviews || 2847
  const averageRating = stats?.averageRating || 4.8
  const happyCustomers = stats ? Math.floor(stats.totalReviews * 0.95) : 2705

  return (
    <section className="py-8 md:py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
      

        {/* Trust Indicators */}
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Why Customers Choose Us
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We're committed to providing exceptional service and quality products that exceed expectations.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
                1
              </div>
              <h4 className="font-bold mb-2">Genuine Products</h4>
              <p className="text-sm text-muted-foreground">
                100% authentic electronics with manufacturer warranties
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
                2
              </div>
              <h4 className="font-bold mb-2">Best Prices</h4>
              <p className="text-sm text-muted-foreground">
                Competitive pricing with regular deals and discounts
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
                3
              </div>
              <h4 className="font-bold mb-2">Excellent Service</h4>
              <p className="text-sm text-muted-foreground">
                Professional support from purchase to after-sales service
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}