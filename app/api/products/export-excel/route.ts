import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import ExcelJS from 'exceljs'
import { processImagesWithDynamicTimeout } from '@/lib/image-processor'
import { generateAllExcelRows, ExcelRow } from '@/lib/excel-export-utils'

export async function POST(request: NextRequest) {
  try {
    console.log('Starting Excel export...')
    await connectDB()
    console.log('Database connected')
    
    const body = await request.json()
    console.log('Request body:', body)
    
    const { category, search } = body
    
    // Build query
    let query: any = {}
    
    if (category) {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') }
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ]
    }
    
    console.log('Query:', query)
    
    // Fetch products
    const products = await Product.find(query).sort({ createdAt: -1 })
    console.log(`Found ${products.length} products`)
    
    if (products.length === 0) {
      return NextResponse.json(
        { error: 'No products found to export' },
        { status: 404 }
      )
    }
    
    // Generate and persist SKUs for products that don't have them
    console.log('Generating SKUs...')
    const existingSKUs: string[] = []
    products.forEach(product => {
      if (product.sku) existingSKUs.push(product.sku)
      product.images.forEach(image => {
        if (image.sku) existingSKUs.push(image.sku)
      })
    })
    
    const productsWithSKUs = await Promise.all(
      products.map(async (product) => {
        let needsSave = false
        
        if (!product.sku) {
          // Generate SKU using the same logic as export
          const { generateSKU, ensureUniqueSKU } = await import('@/lib/excel-export-utils')
          const proposedSKU = generateSKU(product.slug, product.name)
          const uniqueSKU = ensureUniqueSKU(proposedSKU, existingSKUs)
          
          product.sku = uniqueSKU
          existingSKUs.push(uniqueSKU)
          needsSave = true
        }
        
        // Fix wholesale threshold validation issues
        if (product.wholesalePrice && product.wholesalePrice > 0) {
          if (!product.wholesaleThreshold || product.wholesaleThreshold < 1) {
            product.wholesaleThreshold = 1
            needsSave = true
          }
        }
        
        // Save to database if changes were made
        if (needsSave) {
          await product.save()
        }
        
        return product
      })
    )
    console.log('SKUs generated and validation issues fixed')
    
    // Generate Excel rows
    console.log('Generating Excel rows...')
    const excelRows = generateAllExcelRows(productsWithSKUs.map(p => p.toObject()))
    console.log(`Generated ${excelRows.length} rows`)
    
    // Create workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Products')
    
    // Define columns
    worksheet.columns = [
      { header: 'Item Code', key: 'itemCode', width: 16 },
      { header: 'Item Name', key: 'itemName', width: 28 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Colour', key: 'colour', width: 16 },
      { header: 'Image', key: 'imageUrl', width: 20 },
      { header: 'Sizes', key: 'sizes', width: 18 },
      { header: 'Size Stock', key: 'sizeStock', width: 25 },
      { header: 'Retail Price', key: 'retailPrice', width: 15 },
      { header: 'Old Price', key: 'oldPrice', width: 15 },
      { header: 'Stock Quantity', key: 'stockQuantity', width: 16 },
      { header: 'Wholesale Price', key: 'wholesalePrice', width: 18 },
      { header: 'Wholesale Threshold', key: 'wholesaleThreshold', width: 20 },
      { header: 'Description', key: 'description', width: 45 },
      { header: 'Tags', key: 'tags', width: 30 },
    ]
    
    // Add rows
    worksheet.addRows(excelRows)
    
    // Format header row
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }
    
    // Freeze header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }]
    
    // Enable auto-filter
    worksheet.autoFilter = {
      from: 'A1',
      to: 'N1'
    }
    
    // Format numeric columns (ExcelJS uses 1-based indexing)
    worksheet.getColumn(8).numFmt = '0.00' // Retail Price
    worksheet.getColumn(9).numFmt = '0.00' // Old Price
    worksheet.getColumn(10).numFmt = '0' // Stock Quantity
    worksheet.getColumn(11).numFmt = '0.00' // Wholesale Price
    worksheet.getColumn(12).numFmt = '0' // Wholesale Threshold
    
    // Wrap text for Description and Tags
    worksheet.getColumn(13).alignment = { wrapText: true } // Description
    worksheet.getColumn(14).alignment = { wrapText: true } // Tags
    
    // Center Image column
    worksheet.getColumn(5).alignment = { horizontal: 'center' } // Image
    worksheet.getColumn(10).alignment = { horizontal: 'center' } // Stock Quantity
    
    // Add borders between product groups
    let currentItemCode = ''
    excelRows.forEach((row, rowIndex) => {
      const rowNumber = rowIndex + 2 // +2 because header is row 1
      
      if (row.itemCode && row.itemCode !== currentItemCode) {
        // New product group - add top border
        const worksheetRow = worksheet.getRow(rowNumber)
        worksheetRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' }
          }
        })
        currentItemCode = row.itemCode
      }
    })
    
    // Process and embed images with dynamic timeout
    console.log('Processing images with dynamic timeout...')
    const imageUrls = excelRows
      .map(row => row.imageUrl)
      .filter(url => url && url.length > 0)
    
    if (imageUrls.length > 0) {
      const processedImages = await processImagesWithDynamicTimeout(imageUrls, 3, 100)
      
      let imageIndex = 0
      for (let i = 0; i < excelRows.length; i++) {
        const row = excelRows[i]
        if (row.imageUrl && processedImages[imageIndex]) {
          const processed = processedImages[imageIndex]
          const rowNumber = i + 2 // +2 because header is row 1
          
          // Add image to workbook
          const imageId = workbook.addImage({
            buffer: processed.buffer,
            extension: processed.extension,
          })
          
          // Add image to worksheet (Image column is column E, index 4)
          worksheet.addImage(imageId, {
            tl: { col: 4, row: rowNumber - 1 }, // ExcelJS uses 0-based indexing
            ext: { width: 100, height: 100 },
          })
          
          // Clear the URL text from the cell
          worksheet.getCell(rowNumber, 5).value = ''
          
          // Set row height for image
          worksheet.getRow(rowNumber).height = 80
          
          imageIndex++
        } else if (row.imageUrl && !processedImages[imageIndex]) {
          // Image failed to process - add text
          const rowNumber = i + 2
          const cell = worksheet.getCell(rowNumber, 5) // Column E
          cell.value = 'Image unavailable'
          cell.font = { color: { argb: 'FFFF0000' }, italic: true }
          imageIndex++
        }
      }
    }
    
    // Generate filename with date
    const date = new Date().toISOString().split('T')[0]
    const filename = `Javic_Products_Export_${date}.xlsx`
    
    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()
    
    // Return file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
    
  } catch (error: any) {
    console.error('Error generating Excel export:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    return NextResponse.json(
      { error: 'Failed to generate Excel export', details: error.message },
      { status: 500 }
    )
  }
}
