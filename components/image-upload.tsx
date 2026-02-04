'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/custom-toast'

interface ImageUploadProps {
  onUpload: (imageUrl: string) => void
  onRemove?: () => void
  currentImage?: string
  watermarkText?: string
  className?: string
}

export default function ImageUpload({ 
  onUpload, 
  onRemove, 
  currentImage, 
  watermarkText = '© Serenleaf Natural',
  className = '' 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (20MB limit)
    const maxSize = 20 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File size must be less than 20MB')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('watermark_text', watermarkText)
      formData.append('watermark_position', 'bottom-right')
      formData.append('watermark_opacity', '0.7')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok && data.success) {
        onUpload(data.url)
        // Reset file input to allow selecting the same file again
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        throw new Error(data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.'
      toast.error(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {currentImage ? (
        <div 
          className="relative group"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <img
            src={currentImage}
            alt="Uploaded image"
            className={`w-full h-48 object-cover rounded-lg border transition-all ${
              dragOver ? 'border-primary border-2' : 'border-border'
            }`}
          />
          
          {/* Drag overlay */}
          {dragOver && !uploading && (
            <div className="absolute inset-0 bg-primary/20 rounded-lg flex items-center justify-center border-2 border-primary border-dashed">
              <div className="text-center text-primary">
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Drop to replace image</p>
              </div>
            </div>
          )}
          
          {/* Upload overlay when replacing */}
          {uploading && (
            <div className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-sm font-medium">Uploading new image...</p>
              </div>
            </div>
          )}
          
          {/* Hover overlay with buttons */}
          <div className={`absolute inset-0 bg-black/50 transition-opacity rounded-lg flex items-center justify-center ${
            uploading ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'
          }`}>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleClick}
                variant="secondary"
                size="sm"
                disabled={uploading}
              >
                <Upload className="w-4 h-4 mr-1" />
                Replace
              </Button>
              {onRemove && (
                <Button
                  type="button"
                  onClick={onRemove}
                  variant="destructive"
                  size="sm"
                  disabled={uploading}
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            w-full h-48 border-2 border-dashed rounded-lg cursor-pointer
            flex flex-col items-center justify-center gap-4
            transition-colors
            ${dragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPEG, PNG, GIF, WebP up to 20MB
                </p>
                <p className="text-xs text-muted-foreground">
                  Watermark will be added automatically
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}