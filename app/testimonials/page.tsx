'use client'

import { useState, useEffect } from 'react'
import { Star, MessageCircle, Quote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Breadcrumb from '@/components/breadcrumb'
import Header from '@/components/header'
import Footer from '@/components/footer'

interface Testimonial {
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
}

// Featured testimonials as fallback
const featuredTestimonials = [
  {
    _id: '1',
    rating: 5,
    title: 'Excellent Service!',
    comment: 'Amazing customer service and fast delivery. My Samsung fridge arrived in perfect condition.',
    createdAt: '2024-01-15',
    productId: { _id: '1', name: 'Samsung Refrigerator', images: [] },
    userId: { _id: '1', firstName: 'Sarah', lastName: 'Mwangi' }
  },
  {
    _id: '2',
    rating: 5,
    title: 'Great Quality Products',
    comment: 'The LG washing machine works perfectly. Installation was professional and quick.',
    createdAt: '2024-01-10',
    productId: { _id: '2', name: 'LG Washing Machine', images: [] },
    userId: { _id: '2', firstName: 'John', lastName: 'Kamau' }
  },
  {
    _id: '3',
    rating: 4,
    title: 'Highly Recommended',
    comment: 'Good prices and reliable products. Will definitely shop here again.',
    createdAt: '2024-01-08',
    productId: { _id: '3', name: 'Sony TV', images: [] },
    userId: { _id: '3', firstName: 'Grace', lastName: 'Wanjiku' }
  },
  {
    _id: '4',
    rating: 5,
    title: 'Outstanding Experience',
    comment: 'From browsing to delivery, everything was smooth. Great team at Electromatt!',
    createdAt: '2024-01-05',
    productId: { _id: '4', name: 'iPhone 15', images: [] },
    userId: { _id: '4', firstName: 'David', lastName: 'Ochieng' }
  }
]

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const fetchTestimonials = async () => {
    try {
      const response = await fetch('/api/reviews/public-stats')
      if (response.ok) {
        const data = await response.json()
        setTestimonials(data.recentReviews || featuredTestimonials)
      } else {
        setTestimonials(featuredTestimonials)
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error)
      setTestimonials(featuredTestimonials)
    } finally {
      setLoading(false)
    }
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Testimonials', href: '/testimonials' }
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="py-4 px-4 md:px-8 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        </div>

        {/* Hero Section */}
        <section className="py-8 md:py-12 px-4 md:px-8 bg-primary/10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Customer <span className="font-black uppercase tracking-wide">Reviews</span>
            </h1>
            <p className="text-muted-foreground">
              Real experiences from our satisfied customers across Kenya
            </p>
          </div>
        </section>

        {/* Stats Overview */}
        <section className="py-8 px-4 md:px-8 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="text-2xl font-bold text-primary mb-1">4.8</div>
                <div className="text-sm text-muted-foreground">Average Rating</div>
              </div>
              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="text-2xl font-bold text-green-600 mb-1">5000+</div>
                <div className="text-sm text-muted-foreground">Happy Customers</div>
              </div>
              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="text-2xl font-bold text-blue-600 mb-1">98%</div>
                <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
              </div>
              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="text-2xl font-bold text-purple-600 mb-1">1200+</div>
                <div className="text-sm text-muted-foreground">Reviews</div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Grid */}
        <section className="py-8 md:py-12 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">What Our Customers Say</h2>
            
            {loading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-card rounded-lg p-6 border border-border">
                    <div className="animate-pulse">
                      <div className="flex gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((j) => (
                          <div key={j} className="w-4 h-4 bg-muted rounded"></div>
                        ))}
                      </div>
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-4 bg-muted rounded mb-4"></div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full"></div>
                        <div>
                          <div className="h-3 bg-muted rounded mb-1 w-20"></div>
                          <div className="h-3 bg-muted rounded w-16"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {testimonials.slice(0, 6).map((testimonial) => (
                  <div
                    key={testimonial._id}
                    className="bg-card rounded-lg p-6 border border-border hover:shadow-lg transition relative"
                  >
                    <Quote className="w-8 h-8 text-primary/20 absolute top-4 right-4" />
                    
                    {/* Stars */}
                    <div className="flex gap-1 mb-3">
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < testimonial.rating
                                ? 'fill-secondary text-secondary'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                    </div>

                    {/* Review Content */}
                    <h4 className="font-semibold mb-2 text-card-foreground">{testimonial.title}</h4>
                    <p className="text-muted-foreground mb-4 leading-relaxed text-sm">
                      "{testimonial.comment}"
                    </p>

                    {/* Author Info */}
                    <div className="flex items-center gap-3 pt-3 border-t border-border">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-primary">
                          {testimonial.userId.firstName.charAt(0)}{testimonial.userId.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground text-sm">
                          {testimonial.userId.firstName} {testimonial.userId.lastName.charAt(0)}.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {testimonial.productId.name} • {new Date(testimonial.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-8 md:py-12 px-4 md:px-8 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Share Your Experience
            </h2>
            <p className="text-muted-foreground mb-6">
              Purchased from Electromatt? We'd love to hear your feedback!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3">
                <MessageCircle className="w-4 h-4 mr-2" />
                Write a Review
              </Button>
              <Button variant="outline" className="px-6 py-3">
                Shop Now
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
