import { NextRequest, NextResponse } from 'next/server'
import { MediaUploadAPI } from '@/lib/media-upload'
import connectDB from '@/lib/mongodb'
import SiteSettings from '@/models/SiteSettings'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload JPEG, PNG, GIF, or WebP images.' },
        { status: 400 }
      )
    }

    const maxSize = 20 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 20MB.' },
        { status: 400 }
      )
    }

    // Read watermark settings from DB — fall back to request params if provided,
    // otherwise use DB values, otherwise no watermark
    let watermarkText = formData.get('watermark_text') as string | null
    let watermarkPosition = (formData.get('watermark_position') as string) || 'bottom-right'
    let watermarkOpacity = parseFloat(formData.get('watermark_opacity') as string || '0.7')

    // Only skip DB lookup when caller explicitly passes a non-empty watermark_text.
    // An empty string means "use whatever is in settings".
    if (!watermarkText) {
      try {
        await connectDB()
        const settings = await SiteSettings.findOne({})
        if (settings && settings.watermarkEnabled && settings.watermarkText) {
          watermarkText = settings.watermarkText
          watermarkPosition = settings.watermarkPosition || 'bottom-right'
          watermarkOpacity = settings.watermarkOpacity ?? 0.7
        } else {
          watermarkText = ''
        }
      } catch {
        watermarkText = ''
      }
    }

    const mediaAPI = new MediaUploadAPI()

    const uploadResult = await mediaAPI.uploadFile(file, {
      watermark_text: watermarkText || undefined,
      watermark_position: watermarkPosition as any,
      watermark_opacity: watermarkOpacity,
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
      original_name: uploadResult.original_name,
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error during upload' },
      { status: 500 }
    )
  }
}
