'use client'

import { whyChooseUs } from '@/app/page-content'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function JijiWhyChooseUs() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)

  // Images for carousel - mapped to each reason
  const carouselImages = [
    '/Foreman.jpg',           // Fast & Reliable
    '/img2.jpg',              // Professional Team
    '/img3.jpg',              // Wide Coverage
    '/img4.jpg',              // Affordable Rates
    '/img5.jpg',              // 24/7 Support
    '/img6.jpg',              // Fully Insured
  ]

  // Content to display on carousel
  const contentSlides = whyChooseUs

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length)
    setAutoPlay(false)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)
    setAutoPlay(false)
  }

  // Auto-play carousel
  useEffect(() => {
    if (!autoPlay) return
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [autoPlay, carouselImages.length])

  const currentContent = contentSlides[currentSlide]

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 space-y-2">
          <div className="inline-block px-4 py-2 rounded-full bg-[#1E90FF] bg-opacity-10 border border-[#1E90FF] border-opacity-30">
            <span className="text-[#1E90FF] font-semibold text-sm">Why Choose Jiji</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-[#003D7A]">
            Why Businesses Trust Us
          </h2>
        </div>

        {/* Carousel with Overlaid Content */}
        <div className="relative rounded-2xl overflow-hidden group h-96 md:h-[500px]">
          {/* Background Images Container */}
          <div className="absolute inset-0 w-full h-full">
            {carouselImages.map((image, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                  idx === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), url("${image}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              />
            ))}
          </div>

          {/* Content Overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center text-white px-6 md:px-12 max-w-2xl mx-auto animate-fade-in">
              <h3 className="text-3xl md:text-4xl font-bold mb-3" style={{ textShadow: '0 3px 10px rgba(0, 0, 0, 0.9)' }}>
                {currentContent?.title}
              </h3>
              <p className="text-base md:text-lg leading-relaxed" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)' }}>
                {currentContent?.description}
              </p>
            </div>
          </div>

          {/* Previous Button */}
          <button
            onClick={prevSlide}
            className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 bg-[#1E90FF] hover:bg-[#003D7A] text-white p-2 md:p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-lg"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 md:w-7 md:h-7" />
          </button>

          {/* Next Button */}
          <button
            onClick={nextSlide}
            className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 bg-[#1E90FF] hover:bg-[#003D7A] text-white p-2 md:p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-lg"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 md:w-7 md:h-7" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {carouselImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentSlide(idx)
                  setAutoPlay(false)
                }}
                className={`rounded-full transition-all duration-300 ${
                  idx === currentSlide
                    ? 'bg-[#FFD700] w-3 h-3'
                    : 'bg-white bg-opacity-50 w-2 h-2 hover:bg-opacity-75'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Auto-play info */}
        <div className="text-center mt-6 text-gray-600 text-sm">
          Auto-playing • Click navigation to explore more reasons
        </div>
      </div>

      <style>{carouselStyles}</style>
    </section>
  )
}

const carouselStyles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in {
    animation: fadeIn 0.6s ease-out;
  }
`
