'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ProductImageCarouselProps {
  images: string[]
  selectedImageIndex?: number
  onImageChange?: (index: number) => void
}

export default function ProductImageCarousel({ 
  images, 
  selectedImageIndex = 0,
  onImageChange 
}: ProductImageCarouselProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(selectedImageIndex)

  // Update internal state when selectedImageIndex prop changes
  useEffect(() => {
    setCurrentImageIndex(selectedImageIndex)
  }, [selectedImageIndex])

  const handleImageChange = (newIndex: number) => {
    setCurrentImageIndex(newIndex)
    onImageChange?.(newIndex)
  }

  const previousImage = () => {
    const newIndex = (currentImageIndex - 1 + images.length) % images.length
    handleImageChange(newIndex)
  }

  const nextImage = () => {
    const newIndex = (currentImageIndex + 1) % images.length
    handleImageChange(newIndex)
  }

  // Handle empty images array
  if (!images || images.length === 0) {
    return (
      <div>
        <div className="relative bg-muted rounded-lg overflow-hidden mb-4 aspect-square">
          <img
            src="/placeholder.svg"
            alt="Product"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Main Image */}
      <div className="relative bg-muted rounded-lg overflow-hidden mb-4 aspect-square">
        <img
          src={images[currentImageIndex] || '/placeholder.svg'}
          alt="Product"
          className="w-full h-full object-cover"
        />

        {/* Navigation Buttons - Only show if more than 1 image */}
        {images.length > 1 && (
          <>
            <button
              onClick={previousImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Images - Only show if more than 1 image */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => handleImageChange(index)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${
                index === currentImageIndex
                  ? 'border-primary'
                  : 'border-border hover:border-muted-foreground'
              }`}
            >
              <img
                src={image || '/placeholder.svg'}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
