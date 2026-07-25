'use client'

import { useState, useEffect } from 'react'
import {
  Store, Printer, Bell, Plus, Loader2,
  Save, AlertTriangle, CheckCircle2, ChevronDown,
  Users, ShieldCheck, Eye, EyeOff, Trash2, ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Outlet {
  _id: string
  outletId: string
  name: string
  location?: string
  address?: string
  phone?: string
  email?: string
  isActive: boolean
}

interface NotificationSettings {
  _id?: string
  lowStockEnabled: boolean
  lowStockThreshold: number
  syncFailureEnabled: boolean
  offlineModeEnabled: boolean
  creditLimitEnabled: boolean
  creditLimitThreshold: number
  systemNotificationsEnabled: boolean
  inAppNotifications: boolean
}

// ─── Reusable sub-components ──────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, subtitle }: {
  icon: React.ElementType
  title: string
  subtitle?: string
}) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b mb-5">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

function StatusBar({ saving, success, error }: { saving: boolean; success: boolean; error: string }) {
  if (!saving && !success && !error) return null
  return (
    <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-md ${
      error   ? 'bg-red-50   text-red-700   border border-red-200'   :
      success ? 'bg-green-50 text-green-700 border border-green-200' :
                'bg-blue-50  text-blue-700  border border-blue-200'
    }`}>
      {saving  && <Loader2      className="h-3.5 w-3.5 animate-spin shrink-0" />}
      {success && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
      {error   && <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
      <span>{error || (success ? 'Changes saved successfully' : 'Saving…')}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PosSettingsPage() {
  const [activeTab, setActiveTab] = useState<'outlet' | 'printing' | 'notifications'>('outlet')

  // ── Outlet state ──
  const [outlets, setOutlets]               = useState<Outlet[]>([])
  const [selectedId, setSelectedId]         = useState('')
  const [outletForm, setOutletForm]         = useState<Partial<Outlet>>({})
  const [loadingOutlets, setLoadingOutlets] = useState(true)
  const [savingOutlet, setSavingOutlet]     = useState(false)
  const [outletError, setOutletError]       = useState('')
  const [outletSuccess, setOutletSuccess]   = useState(false)
  const [showNewOutlet, setShowNewOutlet]   = useState(false)
  const [newOutlet, setNewOutlet]           = useState({ name: '', location: '', phone: '', email: '' })
  const [creatingOutlet, setCreatingOutlet] = useState(false)
  const [newOutletError, setNewOutletError] = useState('')

  // ── Notification state ──
  const [notif, setNotif]               = useState<NotificationSettings | null>(null)
  const [savingNotif, setSavingNotif]   = useState(false)
  const [notifError, setNotifError]     = useState('')
  const [notifSuccess, setNotifSuccess] = useState(false)

  useEffect(() => { fetchOutlets(); fetchNotifications() }, [])

  useEffect(() => {
    if (!selectedId) return
    const found = outlets.find(o => o._id === selectedId)
    if (found) setOutletForm({ ...found })
    setOutletError(''); setOutletSuccess(false)
  }, [selectedId, outlets])

  // ─── Data fetchers ────────────────────────────────────────────────────────

  const fetchOutlets = async () => {
    setLoadingOutlets(true)
    try {
      const res  = await fetch('/api/pos/settings/outlets')
      const data = await res.json()
      const list: Outlet[] = data.outlets || []
      setOutlets(list)
      if (list.length > 0) { setSelectedId(list[0]._id); setOutletForm({ ...list[0] }) }
    } catch { setOutletError('Failed to load outlets') }
    finally  { setLoadingOutlets(false) }
  }

  const fetchNotifications = async () => {
    try {
      const res  = await fetch('/api/pos/settings/notifications')
      const data = await res.json()
      setNotif(data.settings)
    } catch { /* silent */ }
  }

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSaveOutlet = async () => {
    if (!outletForm._id) return
    setSavingOutlet(true); setOutletError(''); setOutletSuccess(false)
    try {
      const res  = await fetch(`/api/pos/settings/outlets/${outletForm._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: outletForm.name, location: outletForm.location,
          address: outletForm.address, phone: outletForm.phone,
          email: outletForm.email, isActive: outletForm.isActive,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      const saved: Outlet = data.outlet
      setOutlets(prev => prev.map(o => o._id === saved._id ? saved : o))
      setOutletForm({ ...saved })
      setOutletSuccess(true)
      setTimeout(() => setOutletSuccess(false), 3000)
    } catch (err: any) { setOutletError(err.message) }
    finally { setSavingOutlet(false) }
  }

  const handleCreateOutlet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOutlet.name.trim()) { setNewOutletError('Name is required'); return }
    setCreatingOutlet(true); setNewOutletError('')
    try {
      const res  = await fetch('/api/pos/settings/outlets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOutlet),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create')
      const created: Outlet = data.outlet
      setOutlets(prev => [...prev, created])
      setSelectedId(created._id)
      setShowNewOutlet(false)
      setNewOutlet({ name: '', location: '', phone: '', email: '' })
    } catch (err: any) { setNewOutletError(err.message) }
    finally { setCreatingOutlet(false) }
  }

  const handleSaveNotifications = async () => {
    if (!notif) return
    setSavingNotif(true); setNotifError(''); setNotifSuccess(false)
    try {
      const res  = await fetch('/api/pos/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notif),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      setNotif(data.settings)
      setNotifSuccess(true)
      setTimeout(() => setNotifSuccess(false), 3000)
    } catch (err: any) { setNotifError(err.message) }
    finally { setSavingNotif(false) }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const tabs = [
    { id: 'outlet',        label: 'Outlet',        icon: Store   },
    { id: 'printing',      label: 'Printing',      icon: Printer },
    { id: 'notifications', label: 'Notifications', icon: Bell    },
  ] as const

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Page header ── */}
      <div className="shrink-0 px-4 sm:px-6 py-4 border-b bg-background">
        <h1 className="text-lg sm:text-xl font-bold">POS Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage outlets, printing preferences, and notifications.
        </p>
      </div>

      {/* ── Tab bar ── */}
      <div className="shrink-0 flex gap-1 px-4 sm:px-6 py-2 border-b bg-background overflow-x-auto scrollbar-none">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">

        {/* ══ OUTLET TAB ══════════════════════════════════════════════════ */}
        {activeTab === 'outlet' && (
          <div className="space-y-6">
            <SectionHeader
              icon={Store}
              title="Outlet Configuration"
              subtitle="Configure the details of your physical shop locations."
            />

            {loadingOutlets ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-6">

                {/* Outlet selector row */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Select outlet to edit
                    </Label>
                    <Select value={selectedId} onValueChange={setSelectedId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose outlet…" />
                      </SelectTrigger>
                      <SelectContent>
                        {outlets.map(o => (
                          <SelectItem key={o._id} value={o._id}>
                            {o.name}
                            {!o.isActive && (
                              <span className="ml-2 text-xs text-muted-foreground">(inactive)</span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewOutlet(v => !v)}
                      className="gap-1.5 h-10 w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4" />
                      Add Outlet
                    </Button>
                  </div>
                </div>

                {/* New outlet form */}
                {showNewOutlet && (
                  <div className="rounded-xl border bg-muted/30 p-4 space-y-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      New Outlet
                    </p>
                    {newOutletError && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />{newOutletError}
                      </p>
                    )}
                    <form onSubmit={handleCreateOutlet} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <Label className="text-xs">Outlet Name *</Label>
                          <Input className="mt-1" value={newOutlet.name}
                            onChange={e => setNewOutlet(p => ({ ...p, name: e.target.value }))}
                            placeholder="e.g. Mombasa Main Shop" />
                        </div>
                        <div>
                          <Label className="text-xs">Location / Branch</Label>
                          <Input className="mt-1" value={newOutlet.location}
                            onChange={e => setNewOutlet(p => ({ ...p, location: e.target.value }))}
                            placeholder="e.g. Biashara Street" />
                        </div>
                        <div>
                          <Label className="text-xs">Phone</Label>
                          <Input className="mt-1" value={newOutlet.phone}
                            onChange={e => setNewOutlet(p => ({ ...p, phone: e.target.value }))}
                            placeholder="+254…" />
                        </div>
                        <div className="sm:col-span-2">
                          <Label className="text-xs">Email</Label>
                          <Input className="mt-1" type="email" value={newOutlet.email}
                            onChange={e => setNewOutlet(p => ({ ...p, email: e.target.value }))}
                            placeholder="outlet@example.com" />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button type="button" variant="outline" size="sm"
                          onClick={() => { setShowNewOutlet(false); setNewOutletError('') }}>
                          Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={creatingOutlet} className="gap-1.5">
                          {creatingOutlet && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          Create
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Outlet edit form */}
                {outletForm._id && (
                  <div className="rounded-xl border bg-background p-4 sm:p-5 space-y-5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Edit Details
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="of-name">Outlet Name *</Label>
                        <Input id="of-name" className="mt-1"
                          value={outletForm.name ?? ''}
                          onChange={e => setOutletForm(p => ({ ...p, name: e.target.value }))} />
                      </div>

                      <div>
                        <Label htmlFor="of-location">Branch / Location</Label>
                        <Input id="of-location" className="mt-1"
                          value={outletForm.location ?? ''}
                          onChange={e => setOutletForm(p => ({ ...p, location: e.target.value }))}
                          placeholder="e.g. Biashara Street, Marikiti" />
                      </div>

                      <div>
                        <Label htmlFor="of-phone">Contact Phone</Label>
                        <Input id="of-phone" className="mt-1"
                          value={outletForm.phone ?? ''}
                          onChange={e => setOutletForm(p => ({ ...p, phone: e.target.value }))}
                          placeholder="+254…" />
                      </div>

                      <div>
                        <Label htmlFor="of-email">Contact Email</Label>
                        <Input id="of-email" type="email" className="mt-1"
                          value={outletForm.email ?? ''}
                          onChange={e => setOutletForm(p => ({ ...p, email: e.target.value }))}
                          placeholder="outlet@example.com" />
                      </div>

                      <div className="sm:col-span-2">
                        <Label htmlFor="of-address">Full Address</Label>
                        <Input id="of-address" className="mt-1"
                          value={outletForm.address ?? ''}
                          onChange={e => setOutletForm(p => ({ ...p, address: e.target.value }))}
                          placeholder="Full street address" />
                      </div>

                      <div className="sm:col-span-2 flex items-center gap-3 rounded-lg border px-4 py-3 bg-muted/30">
                        <Switch id="of-active"
                          checked={outletForm.isActive ?? true}
                          onCheckedChange={v => setOutletForm(p => ({ ...p, isActive: v }))} />
                        <div>
                          <Label htmlFor="of-active" className="text-sm font-medium cursor-pointer">
                            Outlet is Active
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Inactive outlets are hidden from the POS login
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status + save */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t">
                      <StatusBar saving={savingOutlet} success={outletSuccess} error={outletError} />
                      <div className="sm:ml-auto">
                        <Button onClick={handleSaveOutlet} disabled={savingOutlet} className="gap-2 w-full sm:w-auto">
                          {savingOutlet
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Save className="h-4 w-4" />}
                          {savingOutlet ? 'Saving…' : 'Save Changes'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══ PRINTING TAB ════════════════════════════════════════════════ */}
        {activeTab === 'printing' && (
          <div className="space-y-6">
            <SectionHeader
              icon={Printer}
              title="Receipt Printing"
              subtitle="Paper size and format settings for thermal receipt printers."
            />

            <div className="rounded-xl border bg-background p-4 sm:p-5 space-y-4">
              <p className="text-sm font-medium">Supported Paper Sizes</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { size: '58mm', desc: 'Narrow thermal roll — common on small handheld printers' },
                  { size: '80mm', desc: 'Standard thermal roll — most desktop POS printers' },
                ].map(({ size, desc }) => (
                  <div key={size}
                    className="flex items-start gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Printer className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{size}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground border-t pt-3">
                The paper size selector appears automatically on the receipt screen after each completed sale.
                No additional configuration is required here.
              </p>
            </div>
          </div>
        )}

        {/* ══ NOTIFICATIONS TAB ═══════════════════════════════════════════ */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <SectionHeader
              icon={Bell}
              title="Notifications"
              subtitle="Control which events trigger alerts in the POS."
            />

            {!notif ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border bg-background divide-y">
                  {[
                    { key: 'lowStockEnabled',            label: 'Low stock alerts',          desc: 'Alert when product quantity drops below the threshold' },
                    { key: 'syncFailureEnabled',         label: 'Sync failure notifications',desc: 'Alert when an offline transaction fails to sync' },
                    { key: 'offlineModeEnabled',         label: 'Offline mode warnings',     desc: 'Alert when the POS loses internet connectivity' },
                    { key: 'creditLimitEnabled',         label: 'Credit limit alerts',       desc: 'Alert when a customer is near their credit limit' },
                    { key: 'systemNotificationsEnabled', label: 'System notifications',      desc: 'General POS system alerts and status messages' },
                    { key: 'inAppNotifications',         label: 'In-app notifications',      desc: 'Show notification banners within the POS interface' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between px-4 py-3.5 gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                      <Switch
                        checked={(notif as any)[key] ?? false}
                        onCheckedChange={v => setNotif(p => p ? { ...p, [key]: v } : p)}
                        className="shrink-0"
                      />
                    </div>
                  ))}
                </div>

                {/* Threshold fields */}
                {(notif.lowStockEnabled || notif.creditLimitEnabled) && (
                  <div className="rounded-xl border bg-background p-4 sm:p-5 space-y-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Thresholds
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {notif.lowStockEnabled && (
                        <div>
                          <Label htmlFor="lowStockThreshold">
                            Low stock threshold <span className="text-muted-foreground font-normal">(units)</span>
                          </Label>
                          <Input id="lowStockThreshold" type="number" min="0" className="mt-1"
                            value={notif.lowStockThreshold}
                            onChange={e => setNotif(p => p ? { ...p, lowStockThreshold: parseInt(e.target.value) || 0 } : p)} />
                        </div>
                      )}
                      {notif.creditLimitEnabled && (
                        <div>
                          <Label htmlFor="creditLimitThreshold">
                            Credit alert threshold <span className="text-muted-foreground font-normal">(KSH)</span>
                          </Label>
                          <Input id="creditLimitThreshold" type="number" min="0" className="mt-1"
                            value={notif.creditLimitThreshold}
                            onChange={e => setNotif(p => p ? { ...p, creditLimitThreshold: parseInt(e.target.value) || 0 } : p)} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Status + save */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
                  <StatusBar saving={savingNotif} success={notifSuccess} error={notifError} />
                  <div className="sm:ml-auto">
                    <Button onClick={handleSaveNotifications} disabled={savingNotif} className="gap-2 w-full sm:w-auto">
                      {savingNotif
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Save className="h-4 w-4" />}
                      {savingNotif ? 'Saving…' : 'Save Notifications'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
