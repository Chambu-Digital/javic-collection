interface UploadResponse {
  success: boolean
  file_type: string
  original_name: string
  stored_name: string
  url: string
  thumbnail_url?: string
  watermarked: boolean
  error?: string
}

interface UploadOptions {
  watermark_text?: string
  watermark_position?: 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right'
  watermark_opacity?: number
}

export class MediaUploadAPI {
  private apiUrl: string
  private apiKey: string

  constructor() {
    this.apiUrl = process.env.MEDIA_UPLOAD_API_URL || ''
    this.apiKey = process.env.MEDIA_UPLOAD_API_KEY || ''
    
    if (!this.apiUrl || !this.apiKey) {
      throw new Error('Media upload API configuration missing')
    }
  }

  async uploadFile(file: File, options?: UploadOptions): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('media', file)

    // Add watermark options for images
    if (file.type.startsWith('image/') && options) {
      if (options.watermark_text) {
        formData.append('watermark_text', options.watermark_text)
      }
      if (options.watermark_position) {
        formData.append('watermark_position', options.watermark_position)
      }
      if (options.watermark_opacity) {
        formData.append('watermark_opacity', options.watermark_opacity.toString())
      }
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      return data
    } catch (error) {
      console.error('Media upload error:', error)
      throw error
    }
  }

  async uploadFromBuffer(buffer: ArrayBuffer, filename: string, mimeType: string, options?: UploadOptions): Promise<UploadResponse> {
    const file = new File([buffer], filename, { type: mimeType })
    return this.uploadFile(file, options)
  }

  async uploadFromUrl(imageUrl: string, filename: string, options?: UploadOptions): Promise<UploadResponse> {
    try {
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`)
      }

      const buffer = await response.arrayBuffer()
      const contentType = response.headers.get('content-type') || 'image/jpeg'
      
      const file = new File([buffer], filename, { type: contentType })
      return this.uploadFile(file, options)
    } catch (error) {
      console.error('Error uploading from URL:', error)
      throw error
    }
  }
}

// Utility function to get optimized image URL
export function getOptimizedImageUrl(originalUrl: string, width?: number, height?: number): string {
  // If it's already from our media API, return as is
  if (originalUrl.includes(process.env.MEDIA_BASE_URL || '')) {
    return originalUrl
  }

  // For placeholder images or external URLs, return as is for now
  // You could implement additional optimization logic here
  return originalUrl
}

// Utility function to generate watermark text
export function generateWatermark(productName: string, brandName: string = 'Serenleaf'): string {
  return `© ${brandName} - ${productName}`
}