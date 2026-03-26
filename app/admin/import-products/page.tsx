'use client'

import React, { useState, useRef, useCallback } from 'react'
import * as XLSX from 'xlsx'
import Link from 'next/link'
import { Upload, Download, ArrowLeft, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ColorVariant {
  color: string
  quantity: number
  sizes: string[]
}

interface ParsedProduct {
  itemCode: string
  name: string
  category: string
  description: string
  retailPrice: number
  wholesalePrice: number
  buyingPrice: number
  wholesaleThreshold: number
  bulkDiscountPercent: number
  variants: ColorVariant[]
  hasNoVariants: boolean
  parseWarnings: string[]
}

// ─── Size expansion ───────────────────────────────────────────────────────────
function expandSizes(raw: string | undefined | null): string[] {
  if (!raw) return []
  const str = String(raw).trim()

  const rangeMatch = str.match(/^([a-z0-9]+)\s*[-–]\s*([a-z0-9]+)$/i)
  if (rangeMatch) {
    const from = rangeMatch[1].toUpperCase()
    const to = rangeMatch[2].toUpperCase()
    if (/^\d+$/.test(from) && /^\d+$/.test(to)) {
      const results: string[] = []
      for (let i = parseInt(from); i <= parseInt(to); i++) results.push(String(i))
      return results
    }
    const xlSizes = ['XL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL']
    const norm = (s: string) => s.replace(/^(\d)(xl)$/i, (_, n, x) => `${n}${x.toUpperCase()}`).toUpperCase()
    const fi = xlSizes.indexOf(norm(from))
    const ti = xlSizes.indexOf(norm(to))
    if (fi !== -1 && ti !== -1) return xlSizes.slice(fi, ti + 1)
    return [from, to]
  }

  if (/[,/&]/.test(str)) {
    return str.split(/[,/&]/).map(s => s.trim()).filter(Boolean)
  }

  return [str]
}

// ─── Excel → ParsedProduct[] ──────────────────────────────────────────────────
function parseExcel(buffer: ArrayBuffer): ParsedProduct[] {
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: null, raw: false })

  const productMap = new Map<string, ParsedProduct>()
  let lastCode = ''
  let lastName = ''

  for (const row of rows) {
    const get = (col: string) => {
      const val = row[col]
      return val !== null && val !== undefined ? String(val).trim() : ''
    }
    const getNum = (col: string, fallback = 0) => {
      const v = parseFloat(get(col))
      return isNaN(v) ? fallback : v
    }

    const itemCode = get('Item Code') || lastCode
    const itemName = get('Item Name') || lastName
    if (!itemCode) continue

    lastCode = itemCode
    lastName = itemName

    if (!productMap.has(itemCode)) {
      const retail = getNum('Retail Price')
      const wholesale = getNum('Wholesale Price')
      productMap.set(itemCode, {
        itemCode,
        name: itemName,
        category: get('Category'),
        description: get('Description') || `${itemName} – premium quality from Javic Collection.`,
        retailPrice: retail,
        wholesalePrice: wholesale,
        buyingPrice: getNum('Buying Price'),
        wholesaleThreshold: getNum('Wholesale Threshold', 12),
        bulkDiscountPercent: getNum('Bulk Discount %', retail && wholesale ? Math.round((1 - wholesale / retail) * 100) : 20),
        variants: [],
        hasNoVariants: false,
        parseWarnings: [],
      })
    }

    const product = productMap.get(itemCode)!
    if (itemName && !product.name) product.name = itemName

    const color = get('Color')
    const sizeRaw = get('Size')
    const qty = getNum('Quantity', 0)

    if (!color && !sizeRaw && !qty) {
      product.hasNoVariants = true
      continue
    }

    const sizes = expandSizes(sizeRaw)
    const existing = product.variants.find(v => v.color.toLowerCase() === (color || '').toLowerCase())
    if (existing) {
      existing.quantity += qty
      existing.sizes = Array.from(new Set([...existing.sizes, ...sizes]))
    } else {
      product.variants.push({ color: color || 'Default', quantity: qty, sizes })
    }
  }

  return Array.from(productMap.values())
}

// ─── Template download ────────────────────────────────────────────────────────
function downloadTemplate() {
  const headers = [
    'Item Code', 'Item Name', 'Category', 'Description',
    'Color', 'Size', 'Quantity', 'Buying Price',
    'Wholesale Price', 'Retail Price', 'Wholesale Threshold', 'Bulk Discount %',
  ]
  const examples = [
    ['C001', 'Bridal Robe', 'Robes', '', 'White', 'Free Size', 6, 700, 900, 1000, 12, 20],
    ['C001', 'Bridal Robe', 'Robes', '', 'Peach', 'Free Size', 4, 700, 900, 1000, 12, 20],
    ['C002', 'Lace Bra Set', 'Lingerie', '2-piece lace set', 'Black', '6,7,8,9,10', 50, 500, 800, 1000, 12, 20],
    ['C002', 'Lace Bra Set', 'Lingerie', '', 'Blue', '6,7,8,9,10', 50, 500, 800, 1000, 12, 20],
    ['C003', 'XL Robe', 'Robes', '', 'Pink', '2xl-6xl', 10, 600, 900, 1200, 12, 25],
  ]
  const ws = XLSX.utils.aoa_to_sheet([headers, ...examples])
  ws['!cols'] = headers.map(() => ({ wch: 20 }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Products')
  XLSX.writeFile(wb, 'javic_import_template.xlsx')
}

// ─── Product preview card ─────────────────────────────────────────────────────
function ProductCard({ product }: { product: ParsedProduct }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="bg-pink-700 text-white text-xs font-bold px-2 py-1 rounded flex-shrink-0">
          {product.itemCode}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{product.name}</p>
          <p className="text-xs text-gray-500">
            {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
            {product.category ? ` · ${product.category}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-bold text-pink-700">KSH {product.retailPrice.toLocaleString()}</span>
          {product.hasNoVariants && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">No data</span>
          )}
          {product.parseWarnings.length > 0 && (
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          )}
          <span className="text-gray-400">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[
              ['Retail Price', `KSH ${product.retailPrice.toLocaleString()}`],
              ['Wholesale Price', product.wholesalePrice ? `KSH ${product.wholesalePrice.toLocaleString()}` : '—'],
              ['Wholesale Min', `${product.wholesaleThreshold} units`],
              ['Category', product.category || '(none)'],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-xs text-gray-400 uppercase tracking-wide">{k}</p>
                <p className="font-semibold text-gray-800">{v}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2">
              {product.description}
              {product.description.includes('Javic Collection') && (
                <span className="text-yellow-600 text-xs ml-2">(auto-generated)</span>
              )}
            </p>
          </div>

          {product.variants.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Colour Variants</p>
              <div className="space-y-2">
                {product.variants.map(v => (
                  <div key={v.color} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2">
                    <div className="w-7 h-7 rounded-full bg-pink-200 border-2 border-pink-300 flex items-center justify-center text-xs font-bold text-pink-800 flex-shrink-0">
                      {v.color[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800">{v.color}</p>
                      <p className="text-xs text-gray-500">
                        Stock: {v.quantity} · {v.sizes.length > 0 ? `Sizes: ${v.sizes.join(', ')}` : 'Free size'}
                      </p>
                    </div>
                    <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">📷 Add image later</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {product.parseWarnings.map((w, i) => (
            <p key={i} className="text-xs text-yellow-700">⚠ {w}</p>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ImportProductsPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [products, setProducts] = useState<ParsedProduct[]>([])
  const [status, setStatus] = useState<'idle' | 'parsed' | 'importing' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors?: string[] } | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.xlsx?$/i)) {
      setErrorMsg('Please upload an .xlsx or .xls file.')
      setStatus('error')
      return
    }
    const buffer = await file.arrayBuffer()
    try {
      const parsed = parseExcel(buffer)
      if (parsed.length === 0) {
        setErrorMsg('No products found in the file. Check the column headers match the template.')
        setStatus('error')
        return
      }
      setProducts(parsed)
      setStatus('parsed')
      setErrorMsg('')
    } catch (e: unknown) {
      setErrorMsg(`Could not parse file: ${e instanceof Error ? e.message : String(e)}`)
      setStatus('error')
    }
  }, [])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleImport = async () => {
    setStatus('importing')
    try {
      const res = await fetch('/api/products/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setImportResult(data)
      setStatus('done')
    } catch (e: unknown) {
      setErrorMsg(`Import failed: ${e instanceof Error ? e.message : String(e)}`)
      setStatus('error')
    }
  }

  const reset = () => {
    setProducts([])
    setStatus('idle')
    setErrorMsg('')
    setImportResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const totalVariants = products.reduce((sum, p) => sum + p.variants.length, 0)
  const noDataCount = products.filter(p => p.hasNoVariants).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Product Import</h1>
          <p className="text-sm text-gray-500 mt-1">Upload an Excel file to import multiple products at once</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download Template
          </Button>
          <Link href="/admin/products">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Products
            </Button>
          </Link>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex border-b border-gray-200">
        {['1. Upload Excel', '2. Preview & Review', '3. Import'].map((step, i) => {
          const active = (i === 0 && (status === 'idle' || status === 'error')) ||
            (i === 1 && status === 'parsed') ||
            (i === 2 && (status === 'importing' || status === 'done'))
          const done = (i === 0 && status !== 'idle' && status !== 'error') ||
            (i === 1 && (status === 'importing' || status === 'done'))
          return (
            <div key={step} className={`flex-1 text-center py-3 text-sm font-semibold border-b-2 transition-colors ${
              active ? 'border-pink-600 text-pink-700' :
              done ? 'border-yellow-400 text-yellow-600' :
              'border-transparent text-gray-400'
            }`}>
              {step}
            </div>
          )
        })}
      </div>

      {/* Step 1: Upload */}
      {(status === 'idle' || status === 'error') && (
        <div className="space-y-4">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${
              dragOver ? 'border-pink-500 bg-pink-50' : 'border-gray-300 bg-white hover:border-pink-400 hover:bg-pink-50'
            }`}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-700 mb-1">Drop your Excel file here</p>
            <p className="text-sm text-gray-400 mb-4">.xlsx or .xls supported</p>
            <Button style={{ background: 'linear-gradient(135deg, #990044, #FF0080)' }} className="text-white">
              Choose File
            </Button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} className="hidden" />
          </div>

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm font-medium">
              ❌ {errorMsg}
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="font-semibold text-gray-800 mb-3">📋 How to use</p>
            <ul className="text-sm text-gray-500 space-y-1.5 list-disc list-inside">
              <li>Download the template above — it shows all required columns with examples</li>
              <li>One row per <strong>colour variant</strong> — repeat Item Code & Item Name for each colour</li>
              <li>Sizes: single value, comma list <code className="bg-gray-100 px-1 rounded">M,L,XL</code>, or range <code className="bg-gray-100 px-1 rounded">2xl-6xl</code></li>
              <li>Description is auto-generated from Item Name if left blank</li>
              <li>Wholesale Threshold defaults to 12 units if blank</li>
              <li>After import, add images to each variant in the product editor</li>
            </ul>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {status === 'parsed' && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-center gap-6">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Products</p>
              <p className="text-2xl font-bold text-pink-700">{products.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Colour Variants</p>
              <p className="text-2xl font-bold text-yellow-600">{totalVariants}</p>
            </div>
            {noDataCount > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Missing Data</p>
                <p className="text-2xl font-bold text-orange-500">{noDataCount}</p>
              </div>
            )}
            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={reset}>← Different file</Button>
              <Button onClick={handleImport} style={{ background: 'linear-gradient(135deg, #990044, #FF0080)' }} className="text-white">
                Import {products.length} Products →
              </Button>
            </div>
          </div>

          {noDataCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
              ⚠ {noDataCount} product{noDataCount > 1 ? 's have' : ' has'} no colour/size/stock data — they'll be created as drafts. Add variants manually after import.
            </div>
          )}

          <div className="space-y-2">
            {products.map(p => <ProductCard key={p.itemCode} product={p} />)}
          </div>
        </div>
      )}

      {/* Step 3: Importing */}
      {status === 'importing' && (
        <div className="text-center py-24">
          <Loader2 className="w-12 h-12 animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-xl font-bold text-gray-800">Importing products…</p>
          <p className="text-gray-400 mt-2">Please don't close this page</p>
        </div>
      )}

      {/* Done */}
      {status === 'done' && importResult && (
        <div className="text-center py-16 space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">Import Complete!</h2>
          <p className="text-gray-500">
            {importResult.created} product{importResult.created !== 1 ? 's' : ''} created
            {importResult.skipped > 0 ? `, ${importResult.skipped} skipped (already exist)` : ''}
          </p>
          {importResult.errors && importResult.errors.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left max-w-lg mx-auto">
              <p className="font-semibold text-yellow-700 mb-2">Warnings:</p>
              {importResult.errors.map((e, i) => <p key={i} className="text-sm text-yellow-600">• {e}</p>)}
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={reset}>Import more</Button>
            <Link href="/admin/products">
              <Button style={{ background: 'linear-gradient(135deg, #990044, #FF0080)' }} className="text-white">
                View Products →
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
