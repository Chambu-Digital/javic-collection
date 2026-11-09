import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

/**
 * GET /api/pos/import-items/template
 * Returns a CSV template the user can fill in and re-upload.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user.role !== 'super_admin' && (user.role !== 'admin' || !user.canAccessPOS)) {
      return NextResponse.json({ error: 'POS access required' }, { status: 403 })
    }

    const headers = [
      'name',
      'barcode',
      'sku',
      'category',
      'brand',
      'variant',
      'unit',
      'buyingPrice',
      'sellingPrice',
      'minStockLevel',
      'supplier',
      'initialQty',
      'initialCost',
    ]

    const exampleRows = [
      [
        'Pishori Rice 1kg',
        '6001234567890',
        'RICE-PISH-1KG',
        'Dry Foods',
        'Mwea',
        '',
        'kg',
        '180',
        '220',
        '10',
        'ABC Distributors',
        '50',
        '180',
      ],
      [
        'Cooking Oil 1L',
        '',
        'OIL-COOK-1L',
        'Cooking',
        'Elianto',
        '',
        'litres',
        '145',
        '180',
        '5',
        '',
        '0',
        '',
      ],
    ]

    const rows = [headers, ...exampleRows]
    const csv  = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="import-items-template.csv"',
      },
    })
  } catch (error: any) {
    console.error('Error generating template:', error)
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 })
  }
}
