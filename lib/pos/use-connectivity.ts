'use client'

import { useState, useEffect } from 'react'
import { useConnectivityListener } from '@/lib/pos/sync-manager'
import { getLastSyncTime } from '@/lib/pos/offline-db'

export function usePosConnectivity() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  useEffect(() => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)
    getLastSyncTime().then(setLastSync)

    return useConnectivityListener(async online => {
      setIsOnline(online)
      if (online) {
        setIsSyncing(true)
        const { syncPendingTransactions } = await import('@/lib/pos/sync-manager')
        await syncPendingTransactions()
        const ts = await getLastSyncTime()
        setLastSync(ts)
        setIsSyncing(false)
      }
    })
  }, [])

  const status: 'online' | 'offline' | 'syncing' = isSyncing ? 'syncing' : isOnline ? 'online' : 'offline'

  return { isOnline, isSyncing, status, lastSync }
}
