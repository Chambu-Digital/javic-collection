'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/custom-toast'

interface ReplaceImageButtonProps {
  productId: string
  imageIndex: number
  currentImageUrl: string
  onReplaceSuccess: () => void
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

/**
 * Replace Image Button Component
 * 
 * Allows admin to replace a product variant image without breaking:
 * - Stock tracking (BranchStock records remain valid)
 * - Cart items (still reference correct variant)
 * - Orders (historical references intact)
 * 
 * Process:
 * 1. User selects new image file
 * 2. Upload to cloud storage (Cloudinary/S3)
 * 3. Call replace API to update URL only
 * 4. Refresh parent component to show new image
 */
export function ReplaceImageButton({ 
  productId, 
  imageIndex, 
  currentImageUrl,
  onReplaceSuccess,
  className = '',
  variant = 'outline',
  size = 'sm'
}: ReplaceImageButtonProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error('Image must be less than 10MB')
      return
    }

    try {
      setUploading(true)

      // Step 1: Upload new image to cloud storage
      const formData = new FormData()
      formData.append('file', file)
      
      // Fetch watermark settings if needed
      try {
        const settingsRes = await fetch('/api/admin/settings')
        if (settingsRes.ok) {
          const settings = await settingsRes.json()
          if (settings?.watermarkEnabled && settings?.watermarkText) {
            formData.append('watermark_text', settings.watermarkText)
            formData.append('watermark_position', settings.watermarkPosition || 'bottom-right')
            formData.append('watermark_opacity', String(settings.watermarkOpacity ?? 0.7))
          }
        }
      } catch {
        // Silently continue without watermark if settings fetch fails
      }

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadRes.ok) {
        const error = await uploadRes.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(error.error || 'Failed to upload image')
      }

      const { url: newImageUrl } = await uploadRes.json()

      if (!newImageUrl) {
        throw new Error('No URL returned from upload')
      }

      // Step 2: Replace image URL via API
      const replaceRes = await fetch(
        `/api/admin/products/${productId}/images/${imageIndex}/replace`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newImageUrl })
        }
      )

      if (!replaceRes.ok) {
        const error = await replaceRes.json().catch(() => ({ error: 'Replace failed' }))
        throw new Error(error.error || 'Failed to replace image')
      }

      const result = await replaceRes.json()

      // Step 3: Success - notify and refresh
      toast.success(
        result.message || `Image ${imageIndex + 1} replaced successfully!`
      )
      
      // Callback to parent to refresh data
      onReplaceSuccess()

    } catch (error: any) {
      console.error('Replace image error:', error)
      toast.error(error.message || 'Failed to replace image. Please try again.')
    } finally {
      setUploading(false)
      // Reset file input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleButtonClick = () => {
    // Trigger file input click
    fileInputRef.current?.click()
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
      />
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={uploading}
        onClick={handleButtonClick}
        className="relative"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Replacing...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Replace
          </>
        )}
      </Button>
    </div>
  )
}
