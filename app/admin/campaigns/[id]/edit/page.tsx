'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import PermissionGuard from '@/components/admin/permission-guard'
import { PERMISSIONS } from '@/lib/permissions'
import { CampaignForm } from '@/components/admin/campaign-form'
import type { ICampaign } from '@/models/Campaign'

export default function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [campaign, setCampaign] = useState<ICampaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/campaigns/${id}`)
        if (!res.ok) { setNotFound(true); return }
        const data = await res.json()
        setCampaign(data.campaign)
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
      <PermissionGuard permissions={[PERMISSIONS.CAMPAIGNS_EDIT]}>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-20" />
            <div>
              <Skeleton className="h-7 w-48 mb-1" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-48" />
            </CardContent>
          </Card>
        </div>
      </PermissionGuard>
    )
  }

  if (notFound || !campaign) {
    return (
      <PermissionGuard permissions={[PERMISSIONS.CAMPAIGNS_EDIT]}>
        <div className="space-y-4">
          <Link href="/admin/campaigns">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
          <p className="text-muted-foreground">Campaign not found.</p>
        </div>
      </PermissionGuard>
    )
  }

  return (
    <PermissionGuard permissions={[PERMISSIONS.CAMPAIGNS_EDIT]}>
      <CampaignForm initialData={campaign} campaignId={id} />
    </PermissionGuard>
  )
}
