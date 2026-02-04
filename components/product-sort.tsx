'use client'

import { useState } from 'react'
import { ChevronDown, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export type SortOption = 
  | 'featured'
  | 'price-low-high'
  | 'price-high-low'
  | 'rating'
  | 'newest'
  | 'name-a-z'
  | 'name-z-a'

interface ProductSortProps {
  currentSort: SortOption
  onSortChange: (sort: SortOption) => void
  className?: string
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low-high', label: 'Price: Low to High' },
  { value: 'price-high-low', label: 'Price: High to Low' },
  { value: 'rating', label: 'Customer Rating' },
  { value: 'newest', label: 'Newest First' },
  { value: 'name-a-z', label: 'Name: A to Z' },
  { value: 'name-z-a', label: 'Name: Z to A' }
]

export default function ProductSort({ currentSort, onSortChange, className = '' }: ProductSortProps) {
  const currentSortLabel = sortOptions.find(option => option.value === currentSort)?.label || 'Featured'

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ArrowUpDown className="w-4 h-4 text-gray-500" />
      <span className="text-sm text-gray-600 hidden sm:inline">Sort by:</span>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="justify-between min-w-[160px]">
            <span className="truncate">{currentSortLabel}</span>
            <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {sortOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onSortChange(option.value)}
              className={`cursor-pointer ${
                currentSort === option.value ? 'bg-primary/10 text-primary font-medium' : ''
              }`}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}