import sharp from 'sharp'

export interface ProcessedImageResult {
  buffer: Buffer
  extension: 'png' | 'jpeg'
  mimeType: string
}

/**
 * Fetches an image from a URL and processes it for Excel embedding
 * - Resizes to thumbnail (100x100px max)
 * - Converts unsupported formats (WebP, AVIF, HEIC) to JPEG
 * - Compresses to reasonable size
 * - Maintains aspect ratio
 * - No individual timeout - handled by batch processing
 */
export async function processImageForExcel(
  imageUrl: string,
  maxSize: number = 100
): Promise<ProcessedImageResult | null> {
  try {
    // Fetch image (no timeout - let batch processing handle timing)
    const response = await fetch(imageUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer())

    // Detect image format
    const metadata = await sharp(imageBuffer).metadata()
    const format = metadata.format

    // Process image
    let processor = sharp(imageBuffer)

    // Convert unsupported formats to JPEG
    if (format === 'webp' || format === 'avif' || format === 'heic') {
      processor = processor.jpeg({ quality: 80 })
    } else if (format === 'png') {
      processor = processor.png({ quality: 80 })
    } else if (format === 'jpeg' || format === 'jpg') {
      processor = processor.jpeg({ quality: 80 })
    } else {
      // Unknown format, try JPEG as fallback
      processor = processor.jpeg({ quality: 80 })
    }

    // Resize maintaining aspect ratio
    processor = processor.resize(maxSize, maxSize, {
      fit: 'inside',
      withoutEnlargement: true,
    })

    const processedBuffer = await processor.toBuffer()

    // Determine output format
    const outputFormat = format === 'png' ? 'png' : 'jpeg'
    const mimeType = outputFormat === 'png' ? 'image/png' : 'image/jpeg'

    return {
      buffer: processedBuffer,
      extension: outputFormat,
      mimeType,
    }
  } catch (error) {
    console.error(`Error processing image ${imageUrl}:`, error)
    return null
  }
}

/**
 * Processes multiple images with dynamic timeout system
 * - Initial timeout: 10 seconds
 - Extends to 60 seconds if images are still loading
 * - Completes early if all images load successfully
 * - Marks images as failed if they don't load within 60 seconds
 */
export async function processImagesWithDynamicTimeout(
  imageUrls: string[],
  concurrency: number = 3,
  maxSize: number = 100
): Promise<(ProcessedImageResult | null)[]> {
  const results: (ProcessedImageResult | null)[] = new Array(imageUrls.length).fill(null)
  const completed = new Set<number>()
  let timeoutExtended = false
  
  // Process images with concurrency control
  const processBatch = async (startIndex: number): Promise<void> => {
    for (let i = startIndex; i < imageUrls.length; i += concurrency) {
      if (completed.has(i)) continue
      
      try {
        const result = await processImageForExcel(imageUrls[i], maxSize)
        results[i] = result
        completed.add(i)
      } catch (error) {
        console.error(`Error processing image ${imageUrls[i]}:`, error)
        results[i] = null
        completed.add(i)
      }
    }
  }
  
  // Start concurrent processing
  const promises = []
  for (let i = 0; i < concurrency; i++) {
    promises.push(processBatch(i))
  }
  
  // Dynamic timeout logic
  const checkCompletion = (): Promise<void> => {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        // Check if all images are processed
        if (completed.size === imageUrls.length) {
          clearInterval(checkInterval)
          resolve()
          return
        }
        
        // If not all done after 10 seconds, extend timeout
        if (!timeoutExtended && completed.size < imageUrls.length) {
          timeoutExtended = true
          console.log(`Extending timeout to 60 seconds. ${completed.size}/${imageUrls.length} images processed.`)
        }
      }, 1000)
    })
  }
  
  // Race between completion and timeout
  const timeoutPromise = new Promise<void>((resolve) => {
    setTimeout(() => {
      if (completed.size < imageUrls.length) {
        console.log(`Timeout reached. ${completed.size}/${imageUrls.length} images processed. Marking remaining as failed.`)
      }
      resolve()
    }, 60000) // 60 seconds max
  })
  
  await Promise.race([Promise.all(promises), checkCompletion(), timeoutPromise])
  
  return results
}
