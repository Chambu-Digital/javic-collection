'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Card, CardContent } from '@/components/ui/card'
import {
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  FileText,
  AlertTriangle,
} from 'lucide-react'

/* ── types ─────────────────────────────────────────────────────────────── */
interface RawRow {
  name?: string; barcode?: string; sku?: string; category?: string
  brand?: string; variant?: string; unit?: string
  buyingPrice?: string|number; sellingPrice?: string|number
  minStockLevel?: string|number; supplier?: string
  initialQty?: string|number; initialCost?: string|number
}

interface PreviewRow {
  rowIndex: number; raw: RawRow
  name: string; barcode: string; sku: string; category: string
  buyingPrice: number; sellingPrice: number; minStockLevel: number
  initialQty: number; initialCost: number
  valid: boolean; errors: string[]; warnings: string[]
  isDuplicate: boolean; duplicateOf?: string
}

interface Vendor { _id: string; name: string; vendorCode: string; isHouseStock?: boolean }

interface Props {
  open: boolean
  onClose: () => void
  branchId: string
  onSuccess: () => void
}

/* ── CSV parser ─────────────────────────────────────────────────────────── */
const EXPECTED_HEADERS = [
  'name','barcode','sku','category','brand','variant',
  'unit','buyingPrice','sellingPrice','minStockLevel',
  'supplier','initialQty','initialCost',
]

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').filter(l => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }

  // Simple CSV parser — handles quoted fields
  const parseRow = (line: string): string[] => {
    const result: string[] = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQ && line[i+1] === '"') { cur += '"'; i++ }
        else inQ = !inQ
      } else if (ch === ',' && !inQ) {
        result.push(cur.trim()); cur = ''
      } else {
        cur += ch
      }
    }
    result.push(cur.trim())
    return result
  }

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g,''))
  const rows = lines.slice(1).map(line => {
    const vals = parseRow(line)
    const obj: Record<string,string> = {}
    headers.forEach((h,i) => { obj[h] = vals[i] ?? '' })
    return obj
  }).filter(r => Object.values(r).some(v => v.trim()))

  return { headers, rows }
}

/* ── step labels ────────────────────────────────────────────────────────── */
const STEPS = ['Upload', 'Map & Preview', 'Review', 'Done'] as const
type Step = 0|1|2|3

/* ════════════════════════════════════════════════════════════════════════ */
export default function ImportItemsDialog({ open, onClose, branchId, onSuccess }: Props) {
  const [step, setStep]           = useState<Step>(0)
  const [file, setFile]           = useState<File|null>(null)
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([])
  const [rawRows, setRawRows]     = useState<Record<string,string>[]>([])
  const [columnMap, setColumnMap] = useState<Record<string, string>>({})  // expected → parsed header
  const [preview, setPreview]     = useState<PreviewRow[]>([])
  const [validCount, setValidCount]     = useState(0)
  const [invalidCount, setInvalidCount] = useState(0)
  const [dupCount, setDupCount]         = useState(0)
  const [previewing, setPreviewing]     = useState(false)
  const [previewError, setPreviewError] = useState('')
  const [vendors, setVendors]     = useState<Vendor[]>([])
  const [vendorId, setVendorId]   = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{created:number;skipped:number;errors?:string[]}|null>(null)
  const [filterMode, setFilterMode] = useState<'all'|'errors'|'warnings'>('all')

  const fileRef = useRef<HTMLInputElement>(null)

  /* ── load vendors ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (!open || !branchId) return
    fetch(`/api/admin/vendors?branchId=${branchId}&activeOnly=true`)
      .then(r => r.json())
      .then(d => {
        setVendors(d.vendors || [])
        const house = (d.vendors || []).find((v: Vendor) => v.isHouseStock)
        if (house) setVendorId(house._id)
      })
      .catch(console.error)
  }, [open, branchId])

  /* ── reset on close ───────────────────────────────────────────────── */
  const handleClose = () => {
    setStep(0); setFile(null); setParsedHeaders([]); setRawRows([])
    setColumnMap({}); setPreview([]); setPreviewError('')
    setImportResult(null); setFilterMode('all')
    onClose()
  }

  /* ── file pick ────────────────────────────────────────────────────── */
  const handleFile = (f: File) => {
    setFile(f); setPreviewError('')
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const { headers, rows } = parseCSV(text)
      if (headers.length === 0) {
        setPreviewError('Could not parse the file. Make sure it is a valid CSV.')
        return
      }
      setParsedHeaders(headers)
      setRawRows(rows)
      // Auto-map columns whose names exactly match expected headers
      const autoMap: Record<string,string> = {}
      for (const expected of EXPECTED_HEADERS) {
        const match = headers.find(h => h.replace(/[^a-z0-9]/gi,'').toLowerCase() === expected.toLowerCase())
        if (match) autoMap[expected] = match
      }
      setColumnMap(autoMap)
      setStep(1)
    }
    reader.readAsText(f)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  /* ── build mapped rows ────────────────────────────────────────────── */
  const buildMappedRows = (): RawRow[] =>
    rawRows.map(row => {
      const mapped: Record<string,string> = {}
      for (const [expected, col] of Object.entries(columnMap)) {
        if (col) mapped[expected] = row[col] ?? ''
      }
      return mapped as RawRow
    })

  /* ── call preview API ─────────────────────────────────────────────── */
  const runPreview = async () => {
    setPreviewing(true); setPreviewError('')
    try {
      const res = await fetch('/api/pos/import-items/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: buildMappedRows() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Preview failed')
      setPreview(data.preview)
      setValidCount(data.validCount)
      setInvalidCount(data.invalidCount)
      setDupCount(data.dupCount)
      setStep(2)
    } catch (e: any) {
      setPreviewError(e.message)
    } finally {
      setPreviewing(false)
    }
  }

  /* ── confirm import ───────────────────────────────────────────────── */
  const runImport = async () => {
    if (!vendorId) { setPreviewError('Select a supplier to assign opening stock to.'); return }
    setImporting(true); setPreviewError('')
    try {
      const res = await fetch('/api/pos/import-items/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: preview, branchId, vendorId, overwriteDuplicates: false }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')
      setImportResult(data)
      setStep(3)
      onSuccess()
    } catch (e: any) {
      setPreviewError(e.message)
    } finally {
      setImporting(false)
    }
  }

  /* ── filtered preview rows ────────────────────────────────────────── */
  const visibleRows = preview.filter(r => {
    if (filterMode === 'errors')   return !r.valid || r.isDuplicate
    if (filterMode === 'warnings') return r.warnings.length > 0
    return true
  })

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent'

  /* ── render ─────────────────────────────────────────────────────────── */
  return (
    <Sheet open={open} onOpenChange={o => !o && handleClose()}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto flex flex-col p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <SheetHeader>
            <SheetTitle>Import Items</SheetTitle>
            <SheetDescription>Bulk-create products from a CSV file</SheetDescription>
          </SheetHeader>
          {/* Step indicators */}
          <div className="flex items-center gap-1 mt-4">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step > i ? 'bg-emerald-600 text-white' :
                  step === i ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-400' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {step > i ? '✓' : i+1}
                </div>
                <span className={`text-xs hidden sm:inline ${step === i ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>
                  {label}
                </span>
                {i < STEPS.length-1 && <div className="w-5 h-px bg-gray-200 mx-1" />}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* ── STEP 0: Upload ────────────────────────────────────────── */}
          {step === 0 && (
            <>
              {/* Download template */}
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Download the template first</p>
                  <p className="text-xs text-emerald-700 mt-0.5">Fill it in, then upload it below.</p>
                </div>
                <a href="/api/pos/import-items/template" download="import-items-template.csv"
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 inline-flex items-center gap-2">
                  <Download className="w-4 h-4" /> Template
                </a>
              </div>

              {/* Drop zone */}
              <div
                onDrop={onDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition"
              >
                <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-700">Drop your CSV here or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">CSV files only · Max 2 000 rows</p>
                <input ref={fileRef} type="file" accept=".csv" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>

              {previewError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{previewError}</p>
                </div>
              )}
            </>
          )}

          {/* ── STEP 1: Column mapping ────────────────────────────────── */}
          {step === 1 && (
            <>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">{rawRows.length} rows</span> found in{' '}
                  <span className="font-semibold">{file?.name}</span>.
                  Map each expected field to the column from your file.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EXPECTED_HEADERS.map(field => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                      {field === 'buyingPrice' ? 'Buying Price' :
                       field === 'sellingPrice' ? 'Selling Price *' :
                       field === 'minStockLevel' ? 'Min Stock Level' :
                       field === 'initialQty' ? 'Initial Qty' :
                       field === 'initialCost' ? 'Initial Cost' :
                       field}
                    </label>
                    <select
                      value={columnMap[field] || ''}
                      onChange={e => setColumnMap(prev => ({ ...prev, [field]: e.target.value }))}
                      className={inputCls}
                    >
                      <option value="">(skip)</option>
                      {parsedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              {/* Required field check */}
              {!columnMap['name'] && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800">Map the <strong>name</strong> column — it is required.</p>
                </div>
              )}
              {!columnMap['sellingPrice'] && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800">Map the <strong>sellingPrice</strong> column — it is required.</p>
                </div>
              )}

              {previewError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{previewError}</p>
                </div>
              )}
            </>
          )}

          {/* ── STEP 2: Preview / review rows ────────────────────────── */}
          {step === 2 && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="pt-3 pb-3">
                    <p className="text-xs text-gray-500">Valid</p>
                    <p className="text-2xl font-bold text-emerald-600">{validCount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-3 pb-3">
                    <p className="text-xs text-gray-500">Errors</p>
                    <p className="text-2xl font-bold text-red-600">{invalidCount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-3 pb-3">
                    <p className="text-xs text-gray-500">Duplicates</p>
                    <p className="text-2xl font-bold text-amber-500">{dupCount}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Vendor picker for opening stock */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Assign opening stock to supplier *
                </label>
                <select value={vendorId} onChange={e => setVendorId(e.target.value)} className={inputCls}>
                  <option value="">Select supplier…</option>
                  {vendors.map(v => (
                    <option key={v._id} value={v._id}>{v.name}{v.isHouseStock ? ' (House Stock)' : ''}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-0.5">
                  Only needed for rows with an initial quantity. Products without stock can be imported without a supplier.
                </p>
              </div>

              {/* Row filter */}
              <div className="flex gap-2">
                {(['all','errors','warnings'] as const).map(m => (
                  <button key={m} onClick={() => setFilterMode(m)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                      filterMode === m
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
                    }`}>
                    {m === 'all' ? `All (${preview.length})` :
                     m === 'errors' ? `Errors (${invalidCount + dupCount})` :
                     `Warnings (${preview.filter(r => r.warnings.length > 0).length})`}
                  </button>
                ))}
              </div>

              {/* Row table */}
              <div className="space-y-1.5 max-h-96 overflow-y-auto">
                {visibleRows.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">No rows match this filter.</p>
                ) : visibleRows.map(row => (
                  <div key={row.rowIndex}
                    className={`rounded-xl border px-3 py-2.5 ${
                      !row.valid ? 'border-red-200 bg-red-50' :
                      row.isDuplicate ? 'border-amber-200 bg-amber-50' :
                      row.warnings.length > 0 ? 'border-yellow-200 bg-yellow-50' :
                      'border-gray-200 bg-white'
                    }`}>
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        {!row.valid
                          ? <XCircle className="w-4 h-4 text-red-500" />
                          : row.isDuplicate
                          ? <AlertTriangle className="w-4 h-4 text-amber-500" />
                          : row.warnings.length > 0
                          ? <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            Row {row.rowIndex + 1} — {row.name || '(no name)'}
                          </p>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {row.category && <span className="text-xs text-gray-500">{row.category}</span>}
                            {row.sellingPrice > 0 && (
                              <span className="text-xs font-medium text-gray-700">
                                KSh {row.sellingPrice.toLocaleString()}
                              </span>
                            )}
                            {row.initialQty > 0 && (
                              <span className="text-xs text-emerald-700">+{row.initialQty} units</span>
                            )}
                          </div>
                        </div>
                        {row.errors.length > 0 && (
                          <ul className="mt-1 space-y-0.5">
                            {row.errors.map((e, i) => (
                              <li key={i} className="text-xs text-red-700 flex items-start gap-1">
                                <span className="mt-0.5 flex-shrink-0">•</span>{e}
                              </li>
                            ))}
                          </ul>
                        )}
                        {row.warnings.length > 0 && (
                          <ul className="mt-1 space-y-0.5">
                            {row.warnings.map((w, i) => (
                              <li key={i} className="text-xs text-amber-700 flex items-start gap-1">
                                <span className="mt-0.5 flex-shrink-0">•</span>{w}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {previewError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{previewError}</p>
                </div>
              )}
            </>
          )}

          {/* ── STEP 3: Done ─────────────────────────────────────────── */}
          {step === 3 && importResult && (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
              <CheckCircle2 className="w-14 h-14 text-emerald-600" />
              <div>
                <p className="text-xl font-bold text-gray-900">Import Complete</p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold text-emerald-700">{importResult.created}</span> products created ·{' '}
                  <span className="font-semibold text-gray-500">{importResult.skipped}</span> skipped
                </p>
              </div>
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="w-full max-h-40 overflow-y-auto p-3 bg-red-50 border border-red-200 rounded-lg text-left">
                  <p className="text-xs font-semibold text-red-700 mb-1">Row errors:</p>
                  {importResult.errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-600">• {e}</p>
                  ))}
                </div>
              )}
              <button onClick={handleClose}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
                Done
              </button>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        {step < 3 && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center gap-3">
            <button
              onClick={() => step === 0 ? handleClose() : setStep((step - 1) as Step)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {step === 0 ? 'Cancel' : 'Back'}
            </button>

            {step === 0 && file && (
              <button onClick={() => setStep(1)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 inline-flex items-center gap-2">
                Next <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 1 && (
              <button
                onClick={runPreview}
                disabled={previewing || !columnMap['name'] || !columnMap['sellingPrice']}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {previewing ? 'Validating…' : 'Validate & Preview'}
              </button>
            )}

            {step === 2 && (
              <div className="flex items-center gap-3">
                {validCount === 0 && (
                  <p className="text-sm text-red-600">No valid rows to import.</p>
                )}
                <button
                  onClick={runImport}
                  disabled={importing || validCount === 0 || !vendorId}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  {importing ? 'Importing…' : `Import ${validCount} product${validCount !== 1 ? 's' : ''}`}
                </button>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
