'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Banner {
  _id: string
  title: string
  subtitle: string
  image: string
  isActive: boolean
  order: number
}

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slides, setSlides] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBanners()
  }, [])

  useEffect(() => {
    if (slides.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [slides.length])

  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/banners')
      if (response.ok) {
        const data = await response.json()
        setSlides(data)
      }
    } catch (error) {
      console.error('Error fetching banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  if (loading) {
    return (
      <div className="relative h-64 md:h-96 overflow-hidden rounded-lg mx-4 md:mx-0 bg-muted animate-pulse">
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center">
          <div className="h-8 bg-muted-foreground/20 rounded w-64 mb-4"></div>
          <div className="h-6 bg-muted-foreground/20 rounded w-48"></div>
        </div>
      </div>
    )
  }

  if (slides.length === 0) {
    return (
      <div className="relative h-64 md:h-96 overflow-hidden rounded-lg mx-4 md:mx-0 bg-muted">
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center text-muted-foreground">
          <h2 className="text-2xl font-bold mb-2">No banners available</h2>
          <p className="text-lg">Please add banners in admin settings</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-64 md:h-96 overflow-hidden rounded-lg mx-4 md:mx-0">
      {slides.map((slide, index) => (
        <div
          key={slide._id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={slide.image || "/placeholder.svg"}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 flex flex-col justify-center items-center text-center text-white">
            <h2 className="text-3xl md:text-5xl font-bold mb-2 text-balance">
              {slide.title}
            </h2>
            <p className="text-lg md:text-xl mb-6">{slide.subtitle}</p>
            <Link href="/products">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:bg-gradient-to-r hover:from-primary hover:to-primary/80 border-2 border-white/20 hover:border-white/40">
                 Shop Now
              </Button>
            </Link>
          </div>
        </div>
      ))}

      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/30 hover:bg-white/50 p-2 rounded-full transition"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/30 hover:bg-white/50 p-2 rounded-full transition"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition ${
              index === currentSlide
                ? 'bg-white w-8'
                : 'bg-white/50 w-2'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
