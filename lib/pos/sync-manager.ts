'use client'

import { getSyncQueue, clearSyncedItem, setLastSyncTime } from '@/lib/pos/offline-db'

export type SyncState = 'online' | 'offline' | 'syncing'

let syncInProgress = false

export async function syncPendingTransactions(): Promise<{
  synced: number
  failed: number
  errors: string[]
}> {
  if (syncInProgress || !navigator.onLine) {
    return { synced: 0, failed: 0, errors: [] }
  }

  syncInProgress = true
  const queue = await getSyncQueue()
  let synced = 0
  let failed = 0
  const errors: string[] = []

  for (const item of queue) {
    try {
      const res = await fetch('/api/pos/sales/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(item.payload as object), wasOffline: true }),
      })
      if (res.ok) {
        await clearSyncedItem(item.clientId)
        synced++
      } else {
        const data = await res.json()
        errors.push(data.error || `Failed to sync ${item.clientId}`)
        failed++
      }
    } catch (e) {
      errors.push(e instanceof Error ? e.message : 'Sync error')
      failed++
    }
  }

  if (synced > 0) await setLastSyncTime()
  syncInProgress = false
  return { synced, failed, errors }
}

export function useConnectivityListener(onChange: (online: boolean) => void) {
  if (typeof window === 'undefined') return () => {}
  const handler = () => {
    onChange(navigator.onLine)
    if (navigator.onLine) syncPendingTransactions()
  }
  window.addEventListener('online', handler)
  window.addEventListener('offline', handler)
  return () => {
    window.removeEventListener('online', handler)
    window.removeEventListener('offline', handler)
  }
}
