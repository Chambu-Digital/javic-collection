'use client'

import { Grid3X3, List } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type ViewMode = 'grid' | 'list'

interface ViewToggleProps {
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
  className?: string
}

export default function ViewToggle({ currentView, onViewChange, className = '' }: ViewToggleProps) {
  return (
    <div className={`flex items-center border rounded-lg ${className}`}>
      <Button
        variant={currentView === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('grid')}
        className="rounded-r-none border-r"
      >
        <Grid3X3 className="w-4 h-4" />
        <span className="ml-1 hidden sm:inline">Grid</span>
      </Button>
      <Button
        variant={currentView === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('list')}
        className="rounded-l-none"
      >
        <List className="w-4 h-4" />
        <span className="ml-1 hidden sm:inline">List</span>
      </Button>
    </div>
  )
}