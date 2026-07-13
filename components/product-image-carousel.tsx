'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { IProductImage } from '@/models/Product'

interface ProductImageCarouselProps {
  images: IProductImage[]
  selectedImageIndex?: number
  onImageChange?: (index: number) => void
  basePrice?: number   // product base price — shown as fallback in thumbnail badge
}

export default function ProductImageCarousel({
  images,
  selectedImageIndex = 0,
  onImageChange,
  basePrice,
}: ProductImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(selectedImageIndex)

  useEffect(() => {
    setCurrentIndex(selectedImageIndex)
  }, [selectedImageIndex])

  const handleChange = (newIndex: number) => {
    setCurrentIndex(newIndex)
    onImageChange?.(newIndex)
  }

  const prev = () => handleChange((currentIndex - 1 + images.length) % images.length)
  const next = () => handleChange((currentIndex + 1) % images.length)

  if (!images || images.length === 0) {
    return (
      <div className="relative bg-white rounded-lg overflow-hidden mb-4 aspect-square border border-border">
        <img src="/placeholder.svg" alt="Product" className="w-full h-full object-contain p-4" />
      </div>
    )
  }

  const currentUrl = images[currentIndex]?.url || '/placeholder.svg'

  // Check if any image has a price override — used to decide whether to show badges
  const hasAnyPriceOverride = images.some(img => img.price !== undefined && img.price !== null)

  return (
    <div>
      {/* Main image */}
      <div className="relative bg-white rounded-lg overflow-hidden mb-4 aspect-square border border-border">
        <img src={currentUrl} alt="Product" className="w-full h-full object-contain p-2" />

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </>
        )}

        {/* Price badge on main image when there's an override */}
        {images[currentIndex]?.price !== undefined && images[currentIndex]?.price !== null && (
          <div className="absolute bottom-3 right-3 bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full shadow">
            KSH {images[currentIndex].price!.toLocaleString()}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => {
            const hasOverride = image.price !== undefined && image.price !== null
            return (
              <button
                key={index}
                onClick={() => handleChange(index)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition bg-white ${
                  index === currentIndex
                    ? 'border-primary'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <img
                  src={image.url || '/placeholder.svg'}
                  alt={`Design ${index + 1}`}
                  className="w-full h-full object-contain p-1"
                />
                {/* Per-image price badge on thumbnail */}
                {hasAnyPriceOverride && (
                  <div className={`absolute bottom-0 inset-x-0 text-center text-xs font-semibold py-0.5 ${
                    hasOverride
                      ? 'bg-primary/90 text-primary-foreground'
                      : 'bg-black/40 text-white'
                  }`}>
                    {hasOverride
                      ? `KSH ${image.price!.toLocaleString()}`
                      : basePrice
                        ? `KSH ${basePrice.toLocaleString()}`
                        : ''}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
