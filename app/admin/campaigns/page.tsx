'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Plus,
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Copy,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/custom-toast'
import PermissionGuard from '@/components/admin/permission-guard'
import { PERMISSIONS } from '@/lib/permissions'
import type { ICampaign, CampaignStatus, CampaignType, DisplayMode } from '@/models/Campaign'

// ─── Label maps ──────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  active: 'Active',
  expired: 'Expired',
  disabled: 'Disabled',
}

const STATUS_CLASSES: Record<CampaignStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  expired: 'bg-yellow-100 text-yellow-700',
  disabled: 'bg-red-100 text-red-700',
}

const TYPE_LABELS: Record<CampaignType, string> = {
  discount: 'Discount',
  promotion: 'Promotion',
  new_product: 'New Product',
  new_arrival: 'New Arrival',
  event: 'Event',
  announcement: 'Announcement',
  holiday: 'Holiday',
  clearance: 'Clearance',
  limited_time: 'Limited Time',
  other: 'Other',
}

const DISPLAY_MODE_LABELS: Record<DisplayMode, string> = {
  popup_modal: 'Popup Modal',
  floating_card: 'Floating Card',
  announcement_bar: 'Announcement Bar',
  slide_in_panel: 'Slide-in Panel',
  hero_banner: 'Hero Banner',
  full_screen_overlay: 'Full Screen',
  inline_section: 'Inline Section',
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Campaign extends ICampaign {
  _id: string
  createdAt: string
  updatedAt: string
}

export default function CampaignsPage() {
  const router = useRouter()
  const toast = useToast()

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null)

  const fetchCampaigns = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
      })
      const res = await fetch(`/api/admin/campaigns?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setCampaigns(data.campaigns || [])
      setTotalPages(data.pagination?.pages || 1)
      setTotalCount(data.pagination?.total || 0)
    } catch {
      toast.error('Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm, statusFilter, typeFilter])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, typeFilter])

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleToggleStatus = async (campaign: Campaign) => {
    const newStatus = campaign.status === 'disabled' ? 'draft' : 'disabled'
    setActionLoading(campaign._id)
    try {
      const res = await fetch(`/api/admin/campaigns/${campaign._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      toast.success(newStatus === 'disabled' ? 'Campaign disabled' : 'Campaign enabled')
      fetchCampaigns()
    } catch {
      toast.error('Failed to update campaign status')
    } finally {
      setActionLoading(null)
    }
  }

  const handleActivate = async (campaign: Campaign) => {
    setActionLoading(campaign._id)
    try {
      const res = await fetch(`/api/admin/campaigns/${campaign._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      })
      if (!res.ok) throw new Error()
      toast.success('Campaign activated')
      fetchCampaigns()
    } catch {
      toast.error('Failed to activate campaign')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDuplicate = async (campaign: Campaign) => {
    setActionLoading(campaign._id)
    try {
      // Strip _id and metadata, reset status to draft
      const { _id, createdAt, updatedAt, ...rest } = campaign
      const payload = { ...rest, title: `${rest.title} (Copy)`, status: 'draft' }
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      toast.success('Campaign duplicated')
      router.push(`/admin/campaigns/${data.campaign._id}/edit`)
    } catch {
      toast.error('Failed to duplicate campaign')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setActionLoading(deleteTarget._id)
    try {
      const res = await fetch(`/api/admin/campaigns/${deleteTarget._id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      toast.success('Campaign deleted')
      setDeleteTarget(null)
      fetchCampaigns()
    } catch {
      toast.error('Failed to delete campaign')
    } finally {
      setActionLoading(null)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setTypeFilter('all')
    setCurrentPage(1)
  }

  // ── Summary counts ────────────────────────────────────────────────────────

  const counts = campaigns.reduce(
    (acc, c) => {
      acc[c.status as CampaignStatus] = (acc[c.status as CampaignStatus] || 0) + 1
      return acc
    },
    {} as Partial<Record<CampaignStatus, number>>
  )

  return (
    <PermissionGuard permissions={[PERMISSIONS.CAMPAIGNS_VIEW]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-gray-500 text-sm mt-1">
              {totalCount} total
              {counts.active ? ` · ${counts.active} active` : ''}
              {counts.scheduled ? ` · ${counts.scheduled} scheduled` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchCampaigns} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/admin/campaigns/new">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="discount">Discount</SelectItem>
              <SelectItem value="promotion">Promotion</SelectItem>
              <SelectItem value="new_product">New Product</SelectItem>
              <SelectItem value="new_arrival">New Arrival</SelectItem>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="announcement">Announcement</SelectItem>
              <SelectItem value="holiday">Holiday</SelectItem>
              <SelectItem value="clearance">Clearance</SelectItem>
              <SelectItem value="limited_time">Limited Time</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
            <Button variant="outline" onClick={clearFilters} size="sm">
              Clear filters
            </Button>
          )}
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">
              {loading ? 'Loading...' : `${campaigns.length} campaign${campaigns.length !== 1 ? 's' : ''}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                Loading campaigns…
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Megaphone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No campaigns found</p>
                <p className="text-sm mt-1">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Try adjusting your filters.'
                    : 'Create your first campaign to get started.'}
                </p>
                {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
                  <Link href="/admin/campaigns/new" className="mt-4 inline-block">
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Campaign
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="p-3 font-medium text-gray-600">Title</th>
                      <th className="p-3 font-medium text-gray-600">Type</th>
                      <th className="p-3 font-medium text-gray-600">Status</th>
                      <th className="p-3 font-medium text-gray-600">Display Mode</th>
                      <th className="p-3 font-medium text-gray-600">Priority</th>
                      <th className="p-3 font-medium text-gray-600">Start Date</th>
                      <th className="p-3 font-medium text-gray-600">End Date</th>
                      <th className="p-3 font-medium text-gray-600">Updated</th>
                      <th className="p-3 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign) => (
                      <tr
                        key={campaign._id}
                        className="border-b hover:bg-muted/40 transition-colors"
                      >
                        {/* Title */}
                        <td className="p-3">
                          <p className="font-medium text-gray-900 truncate max-w-[200px]">
                            {campaign.title}
                          </p>
                          {campaign.subtitle && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {campaign.subtitle}
                            </p>
                          )}
                        </td>

                        {/* Type */}
                        <td className="p-3 text-gray-600">
                          {TYPE_LABELS[campaign.type as CampaignType] ?? campaign.type}
                        </td>

                        {/* Status badge */}
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              STATUS_CLASSES[campaign.status as CampaignStatus] ??
                              'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {STATUS_LABELS[campaign.status as CampaignStatus] ?? campaign.status}
                          </span>
                        </td>

                        {/* Display mode */}
                        <td className="p-3 text-gray-600 text-xs">
                          {DISPLAY_MODE_LABELS[campaign.display?.mode as DisplayMode] ??
                            campaign.display?.mode}
                        </td>

                        {/* Priority */}
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                            {campaign.priority}
                          </span>
                        </td>

                        {/* Start date */}
                        <td className="p-3 text-gray-600 text-xs">
                          {campaign.schedule?.startDate
                            ? format(new Date(campaign.schedule.startDate), 'MMM d, yyyy')
                            : '—'}
                        </td>

                        {/* End date */}
                        <td className="p-3 text-gray-600 text-xs">
                          {campaign.schedule?.endDate
                            ? format(new Date(campaign.schedule.endDate), 'MMM d, yyyy')
                            : 'No end'}
                        </td>

                        {/* Updated */}
                        <td className="p-3 text-gray-500 text-xs">
                          {format(new Date(campaign.updatedAt), 'MMM d, yyyy')}
                        </td>

                        {/* Actions */}
                        <td className="p-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            {/* View */}
                            <Link href={`/admin/campaigns/${campaign._id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="View"
                                className="h-8 w-8"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>

                            {/* Edit */}
                            <Link href={`/admin/campaigns/${campaign._id}/edit`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Edit"
                                className="h-8 w-8"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </Link>

                            {/* Duplicate */}
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Duplicate"
                              className="h-8 w-8"
                              disabled={actionLoading === campaign._id}
                              onClick={() => handleDuplicate(campaign)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>

                            {/* Activate (only when draft / scheduled / expired) */}
                            {['draft', 'scheduled', 'expired'].includes(campaign.status) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Activate"
                                className="h-8 w-8 text-green-600 hover:text-green-700"
                                disabled={actionLoading === campaign._id}
                                onClick={() => handleActivate(campaign)}
                              >
                                <ToggleRight className="w-4 h-4" />
                              </Button>
                            )}

                            {/* Disable / Enable toggle */}
                            {campaign.status !== 'expired' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title={campaign.status === 'disabled' ? 'Enable' : 'Disable'}
                                className={`h-8 w-8 ${
                                  campaign.status === 'disabled'
                                    ? 'text-gray-400 hover:text-gray-600'
                                    : 'text-orange-500 hover:text-orange-700'
                                }`}
                                disabled={actionLoading === campaign._id}
                                onClick={() => handleToggleStatus(campaign)}
                              >
                                {campaign.status === 'disabled' ? (
                                  <ToggleLeft className="w-4 h-4" />
                                ) : (
                                  <ToggleRight className="w-4 h-4" />
                                )}
                              </Button>
                            )}

                            {/* Delete */}
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              disabled={actionLoading === campaign._id}
                              onClick={() => setDeleteTarget(campaign)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-gray-900">{deleteTarget?.title}</span>? This will
            also remove all associated analytics data. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={actionLoading === deleteTarget?._id}
              onClick={handleDelete}
            >
              {actionLoading === deleteTarget?._id ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PermissionGuard>
  )
}
