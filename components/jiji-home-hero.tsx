'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function JijiHomeHero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)

  const showcaseImages = [
    '/Foreman.jpg',
    '/img2.jpg',
    '/img3.jpg',
    '/img4.jpg',
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % showcaseImages.length)
    setAutoPlay(false)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + showcaseImages.length) % showcaseImages.length)
    setAutoPlay(false)
  }

  // Auto-play carousel
  useEffect(() => {
    if (!autoPlay) return
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % showcaseImages.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [autoPlay, showcaseImages.length])

  return (
    <section className="relative overflow-hidden h-screen md:h-[700px] flex items-center justify-center group">
      {/* Background Images Container */}
      <div className="absolute inset-0 w-full h-full">
        {showcaseImages.map((image, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url("${image}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
        ))}
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full h-full flex items-center">
        <div className="max-w-2xl animate-fade-in">
          {/* Badge */}
          <div className="inline-block px-3 py-1 rounded-full bg-[#FFD700] bg-opacity-20 border border-[#FFD700] border-opacity-30 mb-6">
            <span className="text-[#FFD700] font-semibold text-sm drop-shadow-lg">Professional Freight Services</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-4" style={{ textShadow: '0 4px 12px rgba(0, 0, 0, 0.8)' }}>
            Moving Your Cargo, Delivering Excellence
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-gray-100 leading-relaxed mb-8 max-w-xl" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)' }}>
            Fast, reliable, and affordable shipping across East Africa. Get a quote in seconds and track your shipment in real-time.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Link href="/quote">
              <Button className="w-full sm:w-auto bg-[#FFD700] hover:bg-[#FFC700] text-[#003D7A] font-bold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all text-base">
                Get a Quote
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>

            <Link href="/services">
              <Button variant="outline" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-[#003D7A] px-8 py-3 rounded-lg text-base font-semibold">
                Explore Services
              </Button>
            </Link>
          </div>

        
        </div>
      </div>

      {/* Previous Button */}
      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 bg-[#1E90FF] hover:bg-[#003D7A] text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-lg"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-7 h-7" />
      </button>

      {/* Next Button */}
      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 bg-[#1E90FF] hover:bg-[#003D7A] text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-lg"
        aria-label="Next slide"
      >
        <ChevronRight className="w-7 h-7" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {showcaseImages.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCurrentSlide(idx)
              setAutoPlay(false)
            }}
            className={`rounded-full transition-all duration-300 ${
              idx === currentSlide
                ? 'bg-[#FFD700] w-4 h-4'
                : 'bg-white bg-opacity-50 w-3 h-3 hover:bg-opacity-75'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }
      `}</style>
    </section>
  )
}