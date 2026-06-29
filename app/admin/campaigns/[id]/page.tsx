'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import PermissionGuard from '@/components/admin/permission-guard'
import { PERMISSIONS } from '@/lib/permissions'
import type { ICampaign, CampaignStatus, CampaignType } from '@/models/Campaign'

const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'Draft', scheduled: 'Scheduled', active: 'Active', expired: 'Expired', disabled: 'Disabled',
}
const STATUS_CLASSES: Record<CampaignStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  expired: 'bg-yellow-100 text-yellow-700',
  disabled: 'bg-red-100 text-red-700',
}
const TYPE_LABELS: Record<CampaignType, string> = {
  discount: 'Discount', promotion: 'Promotion', new_product: 'New Product',
  new_arrival: 'New Arrival', event: 'Event', announcement: 'Announcement',
  holiday: 'Holiday', clearance: 'Clearance', limited_time: 'Limited Time', other: 'Other',
}

interface Analytics {
  totalViews: number
  totalClicks: number
  totalDismissals: number
  totalUniqueVisitors: number
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-sm py-1.5 border-b last:border-0">
      <span className="w-36 text-muted-foreground flex-shrink-0">{label}</span>
      <span className="font-medium text-gray-800 break-all">{value ?? '—'}</span>
    </div>
  )
}

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4 text-center">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [campaign, setCampaign] = useState<ICampaign | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/campaigns/${id}`)
        if (!res.ok) { setNotFound(true); return }
        const data = await res.json()
        setCampaign(data.campaign)
        setAnalytics(data.analytics ?? null)
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <PermissionGuard permissions={[PERMISSIONS.CAMPAIGNS_VIEW]}>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {Array.from({length:5}).map((_,i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        </div>
      </PermissionGuard>
    )
  }

  if (notFound || !campaign) {
    return (
      <PermissionGuard permissions={[PERMISSIONS.CAMPAIGNS_VIEW]}>
        <div className="space-y-4">
          <Link href="/admin/campaigns">
            <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back to Campaigns</Button>
          </Link>
          <p className="text-muted-foreground">Campaign not found.</p>
        </div>
      </PermissionGuard>
    )
  }

  const totalViews = analytics?.totalViews ?? 0
  const totalClicks = analytics?.totalClicks ?? 0
  const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : '0'

  return (
    <PermissionGuard permissions={[PERMISSIONS.CAMPAIGNS_VIEW]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <Link href="/admin/campaigns">
              <Button variant="outline" size="sm" className="mt-1"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{campaign.title}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[campaign.status as CampaignStatus] ?? 'bg-gray-100 text-gray-700'}`}>
                  {STATUS_LABELS[campaign.status as CampaignStatus] ?? campaign.status}
                </span>
              </div>
              <div className="flex gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                <span>{TYPE_LABELS[campaign.type as CampaignType] ?? campaign.type}</span>
                <span>·</span>
                <span>Priority {campaign.priority}</span>
              </div>
            </div>
          </div>
          <Link href={`/admin/campaigns/${id}/edit`}>
            <Button size="sm"><Pencil className="w-4 h-4 mr-2" />Edit Campaign</Button>
          </Link>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <MetricCard label="Total Views" value={totalViews.toLocaleString()} />
          <MetricCard label="Total Clicks" value={totalClicks.toLocaleString()} />
          <MetricCard label="CTR" value={`${ctr}%`} sub="Click-through rate" />
          <MetricCard label="Dismissals" value={(analytics?.totalDismissals ?? 0).toLocaleString()} />
          <MetricCard label="Unique Visitors" value={(analytics?.totalUniqueVisitors ?? 0).toLocaleString()} />
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Schedule</CardTitle></CardHeader>
            <CardContent>
              <InfoRow label="Start Date" value={campaign.schedule?.startDate ? format(new Date(campaign.schedule.startDate), 'PPP p') : '—'} />
              <InfoRow label="End Date" value={campaign.schedule?.endDate ? format(new Date(campaign.schedule.endDate), 'PPP p') : 'No end date'} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Display Settings</CardTitle></CardHeader>
            <CardContent>
              <InfoRow label="Mode" value={campaign.display?.mode?.replace(/_/g, ' ')} />
              <InfoRow label="Position" value={campaign.display?.position} />
              <InfoRow label="Animation" value={campaign.display?.animation} />
              <InfoRow label="Overlay" value={campaign.display?.overlay} />
              <InfoRow label="Delay" value={`${campaign.display?.delaySeconds ?? 0}s`} />
              <InfoRow label="Close Button" value={campaign.display?.showCloseButton ? 'Yes' : 'No'} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Visibility &amp; Audience</CardTitle></CardHeader>
            <CardContent>
              <InfoRow label="Pages" value={(campaign.visibility?.pages ?? []).map(p => p.replace(/_/g, ' ')).join(', ') || '—'} />
              <InfoRow label="Frequency" value={campaign.visibility?.frequency?.replace(/_/g, ' ')} />
              <InfoRow label="Audience" value={(campaign.audience?.targets ?? []).map(t => t.replace(/_/g, ' ')).join(', ') || '—'} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Badge &amp; CTA</CardTitle></CardHeader>
            <CardContent>
              <InfoRow label="Badge" value={campaign.badge?.type ?? 'None'} />
              {campaign.badge?.customText && <InfoRow label="Badge Text" value={campaign.badge.customText} />}
              {campaign.badge?.discountValue && <InfoRow label="Discount" value={`${campaign.badge.discountValue}${campaign.badge.discountType === 'percentage' ? '%' : ''}`} />}
              <InfoRow label="CTA" value={campaign.cta?.enabled ? campaign.cta.text : 'Disabled'} />
              {campaign.cta?.enabled && <InfoRow label="CTA URL" value={campaign.cta.url} />}
            </CardContent>
          </Card>
          {campaign.countdown?.enabled && (
            <Card>
              <CardHeader><CardTitle>Countdown</CardTitle></CardHeader>
              <CardContent>
                <InfoRow label="Ends At" value={campaign.countdown.endsAt ? format(new Date(campaign.countdown.endsAt), 'PPP p') : '—'} />
              </CardContent>
            </Card>
          )}
          {campaign.coupon?.enabled && (
            <Card>
              <CardHeader><CardTitle>Coupon</CardTitle></CardHeader>
              <CardContent>
                <InfoRow label="Code" value={<span className="font-mono">{campaign.coupon.code}</span>} />
                <InfoRow label="Confirmation" value={campaign.coupon.copyConfirmationText} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PermissionGuard>
  )
}
