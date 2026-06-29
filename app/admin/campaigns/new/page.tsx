'use client'

import PermissionGuard from '@/components/admin/permission-guard'
import { PERMISSIONS } from '@/lib/permissions'
import { CampaignForm } from '@/components/admin/campaign-form'

export default function NewCampaignPage() {
  return (
    <PermissionGuard permissions={[PERMISSIONS.CAMPAIGNS_CREATE]}>
      <CampaignForm />
    </PermissionGuard>
  )
}
