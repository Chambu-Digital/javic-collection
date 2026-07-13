'use client'

// This component is kept for backward compatibility but the main product page
// now handles size selection inline. Use this if you need a standalone size picker.

interface ProductVariationsProps {
  sizes: string[]
  selectedSize: string
  onSizeChange: (size: string) => void
}

export default function ProductVariations({ sizes, selectedSize, onSizeChange }: ProductVariationsProps) {
  if (!sizes || sizes.length === 0) return null

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 text-foreground">
        Size:{' '}
        {selectedSize && <span className="font-bold text-primary">{selectedSize}</span>}
      </h3>
      <div className="flex flex-wrap gap-2">
        {sizes.map(size => (
          <button
            key={size}
            onClick={() => onSizeChange(size)}
            className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all
              ${selectedSize === size
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:border-primary/50 text-foreground'
              }`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  )
}
