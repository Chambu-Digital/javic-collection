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
  const [groupViewIndex, setGroupViewIndex] = useState(0) // For viewing different angles within a group

  useEffect(() => {
    setCurrentIndex(selectedImageIndex)
    setGroupViewIndex(0)
  }, [selectedImageIndex])

  // Group images by groupId
  const groupedImages = images.reduce((acc, img, index) => {
    const groupId = img.groupId || `ungrouped-${index}`
    if (!acc[groupId]) {
      acc[groupId] = { images: [], indices: [] }
    }
    acc[groupId].images.push(img)
    acc[groupId].indices.push(index)
    return acc
  }, {} as Record<string, { images: IProductImage[], indices: number[] }>)

  const groupIds = Object.keys(groupedImages)
  const currentGroupId = images[currentIndex]?.groupId || `ungrouped-${currentIndex}`
  const currentGroup = groupedImages[currentGroupId]
  const groupImages = currentGroup?.images || []
  const groupIndices = currentGroup?.indices || []

  const handleChange = (newIndex: number) => {
    setCurrentIndex(newIndex)
    setGroupViewIndex(0)
    onImageChange?.(newIndex)
  }

  const handleGroupViewChange = (newGroupViewIndex: number) => {
    setGroupViewIndex(newGroupViewIndex)
    // Don't trigger onImageChange for group view changes - they're the same variant
  }

  const prev = () => {
    if (groupImages.length > 1) {
      // Navigate within group
      handleGroupViewChange((groupViewIndex - 1 + groupImages.length) % groupImages.length)
    } else {
      // Navigate between groups
      const currentGroupIndex = groupIds.indexOf(currentGroupId)
      const prevGroupIndex = (currentGroupIndex - 1 + groupIds.length) % groupIds.length
      const prevGroupId = groupIds[prevGroupIndex]
      const prevIndex = groupedImages[prevGroupId].indices[0]
      handleChange(prevIndex)
    }
  }

  const next = () => {
    if (groupImages.length > 1) {
      // Navigate within group
      handleGroupViewChange((groupViewIndex + 1) % groupImages.length)
    } else {
      // Navigate between groups
      const currentGroupIndex = groupIds.indexOf(currentGroupId)
      const nextGroupIndex = (currentGroupIndex + 1) % groupIds.length
      const nextGroupId = groupIds[nextGroupIndex]
      const nextIndex = groupedImages[nextGroupId].indices[0]
      handleChange(nextIndex)
    }
  }

  if (!images || images.length === 0) {
    return (
      <div className="relative bg-white rounded-lg overflow-hidden mb-4 aspect-square border border-border">
        <img src="/placeholder.svg" alt="Product" className="w-full h-full object-contain p-4" />
      </div>
    )
  }

  // Get the current image to display (considering group view)
  const currentImage = groupImages[groupViewIndex] || images[currentIndex]
  const currentUrl = currentImage?.url || '/placeholder.svg'

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

        {/* Group indicator */}
        {groupImages.length > 1 && (
          <div className="absolute top-3 left-3 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {groupViewIndex + 1} / {groupImages.length}
          </div>
        )}

        {/* Price badge on main image when there's an override */}
        {currentImage?.price !== undefined && currentImage?.price !== null && (
          <div className="absolute bottom-3 right-3 bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full shadow">
            KSH {currentImage.price!.toLocaleString()}
          </div>
        )}
      </div>

      {/* Thumbnails - show one per group */}
      {groupIds.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {groupIds.map((groupId, groupIndex) => {
            const group = groupedImages[groupId]
            const groupFirstImage = group.images[0]
            const groupFirstIndex = group.indices[0]
            const hasOverride = groupFirstImage.price !== undefined && groupFirstImage.price !== null
            const isSelected = currentGroupId === groupId

            return (
              <button
                key={groupId}
                onClick={() => handleChange(groupFirstIndex)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition bg-white ${
                  isSelected
                    ? 'border-primary'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <img
                  src={groupFirstImage.url || '/placeholder.svg'}
                  alt={`Design ${groupIndex + 1}`}
                  className="w-full h-full object-contain p-1"
                />
                {/* Group indicator badge */}
                {group.images.length > 1 && (
                  <div className="absolute top-1 left-1 bg-purple-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                    {group.images.length}
                  </div>
                )}
                {/* Per-image price badge on thumbnail */}
                {hasAnyPriceOverride && (
                  <div className={`absolute bottom-0 inset-x-0 text-center text-xs font-semibold py-0.5 ${
                    hasOverride
                      ? 'bg-primary/90 text-primary-foreground'
                      : 'bg-black/40 text-white'
                  }`}>
                    {hasOverride
                      ? `KSH ${groupFirstImage.price!.toLocaleString()}`
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
