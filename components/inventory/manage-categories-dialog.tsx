'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Card, CardContent } from '@/components/ui/card'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Tag,
  ArchiveX,
  Eye,
  EyeOff,
  X,
  Save,
} from 'lucide-react'

/* ── types ─────────────────────────────────────────────────────────────── */
interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  image?: string
  icon?: string
  isActive: boolean
  productCount: number
}

interface Props {
  open: boolean
  onClose: () => void
  /** Called after any mutation so the inventory page can refresh its filter */
  onChanged: () => void
}

type PanelMode = 'list' | 'create' | 'edit' | 'delete-confirm'

/* ── small helpers ──────────────────────────────────────────────────────── */
const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent'

/* ════════════════════════════════════════════════════════════════════════ */
export default function ManageCategoriesDialog({ open, onClose, onChanged }: Props) {
  const [categories, setCategories]     = useState<Category[]>([])
  const [loading, setLoading]           = useState(false)
  const [search, setSearch]             = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [panel, setPanel]               = useState<PanelMode>('list')
  const [editing, setEditing]           = useState<Category | null>(null)
  const [deleting, setDeleting]         = useState<Category | null>(null)
  const [reassignTo, setReassignTo]     = useState('')

  // Form fields (create / edit)
  const [fName, setFName]         = useState('')
  const [fDesc, setFDesc]         = useState('')
  const [fIcon, setFIcon]         = useState('📦')
  const [fImage, setFImage]       = useState('')
  const [fActive, setFActive]     = useState(true)

  // Action states
  const [saving,  setSaving]  = useState(false)
  const [removing, setRemoving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [successMsg, setSuccessMsg]   = useState('')

  /* ── load ──────────────────────────────────────────────────────────── */
  const loadCategories = useCallback(async () => {
    if (!open) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (showInactive) params.set('includeInactive', 'true')
      if (search)       params.set('search', search)
      const res  = await fetch(`/api/pos/categories?${params}`)
      const data = await res.json()
      if (res.ok) setCategories(data.categories || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [open, showInactive, search])

  useEffect(() => {
    const t = setTimeout(loadCategories, 250)
    return () => clearTimeout(t)
  }, [loadCategories])

  /* ── open create ───────────────────────────────────────────────────── */
  const openCreate = () => {
    setFName(''); setFDesc(''); setFIcon('📦'); setFImage(''); setFActive(true)
    setActionError(''); setSuccessMsg(''); setEditing(null)
    setPanel('create')
  }

  /* ── open edit ─────────────────────────────────────────────────────── */
  const openEdit = (cat: Category) => {
    setFName(cat.name); setFDesc(cat.description || ''); setFIcon(cat.icon || '📦')
    setFImage(cat.image || ''); setFActive(cat.isActive)
    setActionError(''); setSuccessMsg(''); setEditing(cat)
    setPanel('edit')
  }

  /* ── save (create or edit) ─────────────────────────────────────────── */
  const handleSave = async () => {
    if (!fName.trim()) { setActionError('Name is required.'); return }
    setSaving(true); setActionError(''); setSuccessMsg('')
    try {
      const isCreate = panel === 'create'
      const url      = isCreate ? '/api/pos/categories' : `/api/pos/categories/${editing!._id}`
      const method   = isCreate ? 'POST' : 'PATCH'
      const res      = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        fName.trim(),
          description: fDesc.trim() || fName.trim(),
          icon:        fIcon.trim() || '📦',
          image:       fImage.trim() || '/placeholder.svg',
          isActive:    fActive,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setSuccessMsg(isCreate ? `"${fName.trim()}" created.` : `"${fName.trim()}" updated.`)
      await loadCategories()
      onChanged()
      setPanel('list')
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setSaving(false)
    }
  }

  /* ── delete / archive ──────────────────────────────────────────────── */
  const openDelete = (cat: Category) => {
    setDeleting(cat); setReassignTo(''); setActionError(''); setSuccessMsg('')
    setPanel('delete-confirm')
  }

  const handleDelete = async () => {
    if (!deleting) return
    setRemoving(true); setActionError('')
    try {
      const body: any = {}
      if (reassignTo) body.reassignToId = reassignTo

      const res  = await fetch(`/api/pos/categories/${deleting._id}`, {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Delete failed')

      const msg =
        data.action === 'deleted'               ? `"${deleting.name}" deleted.` :
        data.action === 'archived'              ? `"${deleting.name}" archived (has ${data.productCount} products).` :
        data.action === 'reassigned_and_deleted'? `"${deleting.name}" deleted. ${data.movedProducts} products moved.` :
        'Done.'

      setSuccessMsg(msg)
      await loadCategories()
      onChanged()
      setPanel('list')
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setRemoving(false)
    }
  }

  /* ── quick-toggle active ───────────────────────────────────────────── */
  const toggleActive = async (cat: Category) => {
    try {
      const res = await fetch(`/api/pos/categories/${cat._id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ isActive: !cat.isActive }),
      })
      if (res.ok) { await loadCategories(); onChanged() }
    } catch (e) { console.error(e) }
  }

  /* ── close ─────────────────────────────────────────────────────────── */
  const handleClose = () => {
    setPanel('list'); setSearch(''); setActionError(''); setSuccessMsg('')
    onClose()
  }

  /* ── render ─────────────────────────────────────────────────────────── */
  const otherCategories = categories.filter(c => deleting && c._id !== deleting._id)

  return (
    <Sheet open={open} onOpenChange={o => !o && handleClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto flex flex-col p-0">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between gap-3">
          <div>
            <SheetHeader>
              <SheetTitle>
                {panel === 'list'           && 'Manage Categories'}
                {panel === 'create'         && 'Create Category'}
                {panel === 'edit'           && 'Edit Category'}
                {panel === 'delete-confirm' && 'Remove Category'}
              </SheetTitle>
              <SheetDescription>
                {panel === 'list'           && `${categories.length} categor${categories.length !== 1 ? 'ies' : 'y'}`}
                {panel === 'create'         && 'Add a new product category'}
                {panel === 'edit'           && `Editing "${editing?.name}"`}
                {panel === 'delete-confirm' && `"${deleting?.name}" · ${deleting?.productCount} product${deleting?.productCount !== 1 ? 's' : ''}`}
              </SheetDescription>
            </SheetHeader>
          </div>
          {panel !== 'list' && (
            <button onClick={() => { setPanel('list'); setActionError('') }}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── Success / Error banners ─────────────────────────────── */}
          {successMsg && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-800">{successMsg}</p>
            </div>
          )}
          {actionError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{actionError}</p>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              LIST PANEL
          ═══════════════════════════════════════════════════════ */}
          {panel === 'list' && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search categories…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowInactive(v => !v)}
                  title={showInactive ? 'Hide inactive' : 'Show inactive'}
                  className={`p-2 rounded-lg border transition ${
                    showInactive ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {showInactive ? <Eye className="w-4 h-4 text-gray-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                </button>
                <button
                  onClick={openCreate}
                  className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> New
                </button>
              </div>

              {/* Category list */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-12">
                  <Tag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    {search ? 'No categories match your search.' : 'No categories yet. Create one to get started.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {categories.map(cat => (
                    <div
                      key={cat._id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                        cat.isActive ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-70'
                      }`}
                    >
                      {/* Icon */}
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
                        {cat.image && cat.image !== '/placeholder.svg'
                          ? <img src={cat.image} alt={cat.name} className="w-full h-full object-cover rounded-lg" />
                          : <span>{cat.icon || '📦'}</span>
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900 truncate">{cat.name}</p>
                          {!cat.isActive && (
                            <span className="px-1.5 py-0.5 bg-gray-200 text-gray-500 text-xs rounded-full">Inactive</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {cat.productCount} product{cat.productCount !== 1 ? 's' : ''}
                          {cat.description && cat.description !== cat.name && (
                            <> · <span className="truncate">{cat.description}</span></>
                          )}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => toggleActive(cat)}
                          title={cat.isActive ? 'Deactivate' : 'Activate'}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                        >
                          {cat.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEdit(cat)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDelete(cat)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              CREATE / EDIT PANEL
          ═══════════════════════════════════════════════════════ */}
          {(panel === 'create' || panel === 'edit') && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
                  <input
                    type="text"
                    value={fName}
                    onChange={e => setFName(e.target.value)}
                    placeholder="e.g. Dry Foods"
                    autoFocus
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                  <input
                    type="text"
                    value={fDesc}
                    onChange={e => setFDesc(e.target.value)}
                    placeholder="Short description (optional)"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Icon (emoji)</label>
                  <input
                    type="text"
                    value={fIcon}
                    onChange={e => setFIcon(e.target.value)}
                    placeholder="📦"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Image URL (optional)</label>
                  <input
                    type="text"
                    value={fImage}
                    onChange={e => setFImage(e.target.value)}
                    placeholder="https://…"
                    className={inputCls}
                  />
                </div>
                {panel === 'edit' && (
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fActive}
                        onChange={e => setFActive(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600"
                      />
                      <span className="text-sm font-medium text-gray-700">Active</span>
                      <span className="text-xs text-gray-400">(inactive categories are hidden from filters)</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Preview */}
              {fName && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-xl overflow-hidden flex-shrink-0">
                    {fImage && fImage !== '/placeholder.svg'
                      ? <img src={fImage} alt={fName} className="w-full h-full object-cover rounded-lg" />
                      : <span>{fIcon || '📦'}</span>
                    }
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{fName}</p>
                    {fDesc && <p className="text-xs text-gray-500 mt-0.5">{fDesc}</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              DELETE CONFIRM PANEL
          ═══════════════════════════════════════════════════════ */}
          {panel === 'delete-confirm' && deleting && (
            <div className="space-y-4">
              {deleting.productCount === 0 ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm font-semibold text-red-900">Delete "{deleting.name}"?</p>
                  <p className="text-xs text-red-700 mt-1">
                    This category has no products. It will be permanently deleted.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm font-semibold text-amber-900">
                      "{deleting.name}" has {deleting.productCount} product{deleting.productCount !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Reassign the products to another category to delete it, or archive it instead.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Reassign products to (leave blank to archive)
                    </label>
                    <select
                      value={reassignTo}
                      onChange={e => setReassignTo(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">Archive category instead</option>
                      {otherCategories.filter(c => c.isActive).map(c => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.productCount} products)
                        </option>
                      ))}
                    </select>
                  </div>

                  {!reassignTo && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-start gap-2">
                      <ArchiveX className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-600">
                        The category will be <strong>archived</strong> (hidden from filters) but not deleted.
                        Products keep their current category. You can reactivate it at any time.
                      </p>
                    </div>
                  )}
                  {reassignTo && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <p className="text-xs text-emerald-800">
                        {deleting.productCount} product{deleting.productCount !== 1 ? 's' : ''} will be moved to "
                        {otherCategories.find(c => c._id === reassignTo)?.name}", then "{deleting.name}" will be permanently deleted.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {panel !== 'list' && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
            <button
              onClick={() => { setPanel('list'); setActionError('') }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            {(panel === 'create' || panel === 'edit') && (
              <button
                onClick={handleSave}
                disabled={saving || !fName.trim()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving…' : panel === 'create' ? 'Create Category' : 'Save Changes'}
              </button>
            )}

            {panel === 'delete-confirm' && (
              <button
                onClick={handleDelete}
                disabled={removing}
                className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2 ${
                  reassignTo
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : reassignTo ? <Trash2 className="w-4 h-4" /> : <ArchiveX className="w-4 h-4" />}
                {removing ? 'Processing…' : reassignTo ? 'Reassign & Delete' : 'Archive Category'}
              </button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
