'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Zap, Home, ChefHat, Tv, Smartphone, Monitor, Headphones, Wifi, Cable } from 'lucide-react'
import Link from 'next/link'
import { ICategory } from '@/models/Category'

// Icon mapping for electronics categories
const iconMap: { [key: string]: any } = {
  'Home': Home,
  'ChefHat': ChefHat,
  'Tv': Tv,
  'Smartphone': Smartphone,
  'Monitor': Monitor,
  'Headphones': Headphones,
  'Wifi': Wifi,
  'Cable': Cable,
  'Zap': Zap,
}

export default function CategoryGrid() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)
  const [categories, setCategories] = useState<ICategory[]>([])
  const [loading, setLoading] = useState(true)

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setShowLeftArrow(scrollLeft > 0)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (categories.length > 0) {
      checkScrollButtons()
      const handleResize = () => checkScrollButtons()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [categories])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.children[0]?.clientWidth || 280
      scrollContainerRef.current.scrollBy({
        left: -cardWidth * 2,
        behavior: 'smooth'
      })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.children[0]?.clientWidth || 280
      scrollContainerRef.current.scrollBy({
        left: cardWidth * 2,
        behavior: 'smooth'
      })
    }
  }

  return (
    <section className="py-6 md:py-10 px-4 md:px-8 bg-muted/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Shop by Category
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover our wide range of electronics and appliances
          </p>
        </div>

        <div className="relative">
          {/* Left Arrow */}
          {showLeftArrow && (
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 hover:bg-white shadow-lg rounded-full p-3 transition-all duration-200 border border-gray-200"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
          )}

          {/* Right Arrow */}
          {showRightArrow && (
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 hover:bg-white shadow-lg rounded-full p-3 transition-all duration-200 border border-gray-200"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          )}

          {/* Scrollable Grid Container */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScrollButtons}
            className="overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            <div className="flex gap-4 min-w-full w-max">
              {loading ? (
                // Loading skeleton
                Array(8).fill(0).map((_, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-64 h-40 rounded-lg bg-muted animate-pulse"
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    <div className="w-full h-24 bg-muted-foreground/20 rounded-t-lg" />
                    <div className="p-3">
                      <div className="h-4 bg-muted-foreground/20 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted-foreground/20 rounded w-full" />
                    </div>
                  </div>
                ))
              ) : (
                categories.map((category) => {
                  const Icon = iconMap[category.icon] || Zap
                  return (
                    <Link
                      key={category._id}
                      href={`/category/${category.slug}`}
                      className="group flex-shrink-0 w-64 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100"
                      style={{ scrollSnapAlign: 'start' }}
                    >
                      {/* Category Image */}
                      <div className="relative h-24 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                        <img
                          src={category.image || '/placeholder.svg'}
                          alt={category.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            // Fallback to gradient background with icon if image fails
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                        {/* Fallback icon overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
                          <Icon className="w-8 h-8 text-primary/60" />
                        </div>
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                      </div>

                      {/* Category Info */}
                      <div className="p-3">
                        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {category.description}
                        </p>
                        
                        {/* Shop now indicator */}
                        <div className="flex items-center mt-2 text-primary text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span>Shop Now</span>
                          <ChevronRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* View All Categories Button */}
        <div className="text-center mt-6">
          <Link href="/categories">
            <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md">
              View All Categories
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}
