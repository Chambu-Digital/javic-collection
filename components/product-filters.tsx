'use client'

import { useState, useEffect } from 'react'
import { Filter, X, Star, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface FilterOptions {
  categories: string[]
  priceRange: [number, number]
  rating: number
  inStock: boolean
  brands: string[]
  features: string[]
}

interface ProductFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void
  availableCategories: string[]
  availableBrands: string[]
  maxPrice: number
  className?: string
}

export default function ProductFilters({ 
  onFiltersChange, 
  availableCategories, 
  availableBrands, 
  maxPrice,
  className = '' 
}: ProductFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    priceRange: [0, maxPrice],
    rating: 0,
    inStock: false,
    brands: [],
    features: []
  })

  const [isOpen, setIsOpen] = useState({
    categories: true,
    price: true,
    rating: true,
    availability: true,
    brands: true
  })

  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const handleCategoryChange = (category: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      categories: checked 
        ? [...prev.categories, category]
        : prev.categories.filter(c => c !== category)
    }))
  }

  const handleBrandChange = (brand: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      brands: checked 
        ? [...prev.brands, brand]
        : prev.brands.filter(b => b !== brand)
    }))
  }

  const handlePriceChange = (value: number[]) => {
    setFilters(prev => ({
      ...prev,
      priceRange: [value[0], value[1]]
    }))
  }

  const handleRatingChange = (rating: number) => {
    setFilters(prev => ({
      ...prev,
      rating: prev.rating === rating ? 0 : rating
    }))
  }

  const clearFilters = () => {
    setFilters({
      categories: [],
      priceRange: [0, maxPrice],
      rating: 0,
      inStock: false,
      brands: [],
      features: []
    })
  }

  const hasActiveFilters = 
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.rating > 0 ||
    filters.inStock ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < maxPrice

  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filters
        </h3>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Categories */}
        <Collapsible open={isOpen.categories} onOpenChange={(open) => setIsOpen(prev => ({ ...prev, categories: open }))}>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
            <h4 className="font-medium">Categories</h4>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen.categories ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2">
            {availableCategories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={filters.categories.includes(category)}
                  onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
                />
                <label 
                  htmlFor={`category-${category}`}
                  className="text-sm cursor-pointer hover:text-primary"
                >
                  {category}
                </label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Price Range */}
        <Collapsible open={isOpen.price} onOpenChange={(open) => setIsOpen(prev => ({ ...prev, price: open }))}>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
            <h4 className="font-medium">Price Range</h4>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen.price ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-4">
            <Slider
              value={filters.priceRange}
              onValueChange={handlePriceChange}
              max={maxPrice}
              min={0}
              step={1000}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>KSH {filters.priceRange[0].toLocaleString()}</span>
              <span>KSH {filters.priceRange[1].toLocaleString()}</span>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Rating */}
        <Collapsible open={isOpen.rating} onOpenChange={(open) => setIsOpen(prev => ({ ...prev, rating: open }))}>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
            <h4 className="font-medium">Customer Rating</h4>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen.rating ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2">
            {[4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                onClick={() => handleRatingChange(rating)}
                className={`flex items-center space-x-2 w-full text-left p-2 rounded hover:bg-gray-50 ${
                  filters.rating === rating ? 'bg-primary/10 border border-primary/20' : ''
                }`}
              >
                <div className="flex items-center">
                  {Array(5).fill(0).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm">& Up</span>
              </button>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Availability */}
        <Collapsible open={isOpen.availability} onOpenChange={(open) => setIsOpen(prev => ({ ...prev, availability: open }))}>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
            <h4 className="font-medium">Availability</h4>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen.availability ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="in-stock"
                checked={filters.inStock}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, inStock: checked as boolean }))}
              />
              <label htmlFor="in-stock" className="text-sm cursor-pointer hover:text-primary">
                In Stock Only
              </label>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Brands */}
        {availableBrands.length > 0 && (
          <Collapsible open={isOpen.brands} onOpenChange={(open) => setIsOpen(prev => ({ ...prev, brands: open }))}>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
              <h4 className="font-medium">Brands</h4>
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen.brands ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-2">
              {availableBrands.map((brand) => (
                <div key={brand} className="flex items-center space-x-2">
                  <Checkbox
                    id={`brand-${brand}`}
                    checked={filters.brands.includes(brand)}
                    onCheckedChange={(checked) => handleBrandChange(brand, checked as boolean)}
                  />
                  <label 
                    htmlFor={`brand-${brand}`}
                    className="text-sm cursor-pointer hover:text-primary"
                  >
                    {brand}
                  </label>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-6 pt-6 border-t">
          <h5 className="font-medium mb-3">Active Filters:</h5>
          <div className="flex flex-wrap gap-2">
            {filters.categories.map((category) => (
              <span key={category} className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs flex items-center gap-1">
                {category}
                <button onClick={() => handleCategoryChange(category, false)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.brands.map((brand) => (
              <span key={brand} className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs flex items-center gap-1">
                {brand}
                <button onClick={() => handleBrandChange(brand, false)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.rating > 0 && (
              <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs flex items-center gap-1">
                {filters.rating}+ Stars
                <button onClick={() => handleRatingChange(filters.rating)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.inStock && (
              <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs flex items-center gap-1">
                In Stock
                <button onClick={() => setFilters(prev => ({ ...prev, inStock: false }))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}