'use client'

import { useState, useRef } from 'react'
import { X, Loader2, Upload, ImageIcon } from 'lucide-react'
import { ICategory } from '@/models/Category'

interface QuickCategoryModalProps {
  open: boolean
  onClose: () => void
  onCreated: (category: ICategory) => void
}

export default function QuickCategoryModal({ open, onClose, onCreated }: QuickCategoryModalProps) {
  const [name, setName]             = useState('')
  const [desc, setDesc]             = useState('')
  const [imageUrl, setImageUrl]     = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [uploading, setUploading]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show local preview immediately
    setImagePreview(URL.createObjectURL(file))
    setUploading(true)
    setError('')

    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setImageUrl(data.url)
    } catch (err: any) {
      setError(err.message || 'Image upload failed.')
      setImagePreview('')
      setImageUrl('')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) { setError('Category name is required.'); return }
    if (!imageUrl) { setError('Please upload a category image.'); return }
    if (uploading) { setError('Please wait for the image to finish uploading.'); return }

    setSaving(true)
    setError('')

    try {
      const slug = trimmedName
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()

      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          slug,
          description: desc.trim() || trimmedName,
          image: imageUrl,
          icon: '📦',
          isActive: true,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to create category.')
        return
      }

      const created: ICategory = await res.json()
      onCreated(created)

      // Reset state
      setName('')
      setDesc('')
      setImageUrl('')
      setImagePreview('')
      onClose()
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inp = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create new category"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">New Category</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                You can update the icon and other details from the Category Management page later.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setError('') }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSave() } }}
                placeholder="e.g. Lingerie"
                className={inp}
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="Short description"
                className={inp}
              />
            </div>

            {/* Image upload */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Category Image <span className="text-red-500">*</span>
              </label>

              {/* Preview or upload zone */}
              {imagePreview ? (
                <div className="relative w-full h-36 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  {/* Uploading overlay */}
                  {uploading && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      <span className="text-sm text-blue-600 font-medium">Uploading…</span>
                    </div>
                  )}
                  {/* Replace button */}
                  {!uploading && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="absolute bottom-2 right-2 bg-white/90 text-gray-700 text-xs px-2 py-1 rounded-md shadow hover:bg-white border border-gray-200 transition-colors"
                    >
                      Replace
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-36 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                >
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-xs font-medium">Click to upload image</span>
                  <span className="text-xs">PNG, JPG, WebP</span>
                </button>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-5 py-3 border-t bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || uploading}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || uploading || !name.trim() || !imageUrl}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {(saving || uploading) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {uploading ? 'Uploading…' : saving ? 'Creating…' : 'Create Category'}
            </button>
          </div>

        </div>
      </div>
    </>
  )
}
