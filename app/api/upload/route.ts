import { NextRequest, NextResponse } from 'next/server'
import { MediaUploadAPI } from '@/lib/media-upload'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload JPEG, PNG, GIF, or WebP images.' },
        { status: 400 }
      )
    }

    // Validate file size (20MB limit)
    const maxSize = 20 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 20MB.' },
        { status: 400 }
      )
    }

    // Get watermark parameters
    const watermarkText = formData.get('watermark_text') as string || '© Serenleaf Natural'
    const watermarkPosition = formData.get('watermark_position') as string || 'bottom-right'
    const watermarkOpacity = parseFloat(formData.get('watermark_opacity') as string || '0.7')

    // Initialize media upload API
    const mediaAPI = new MediaUploadAPI()

    // Upload using the existing utility
    const uploadResult = await mediaAPI.uploadFile(file, {
      watermark_text: watermarkText,
      watermark_position: watermarkPosition as any,
      watermark_opacity: watermarkOpacity
    })

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || 'Upload failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      filename: uploadResult.stored_name,
      original_name: uploadResult.original_name
    })

  } catch (error) {
    console.error('Upload error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error during upload'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}