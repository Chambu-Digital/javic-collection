'use client'

import { useState } from 'react'
import { RefreshCw, CheckCircle, AlertTriangle, Clock, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

export default function SyncStatusPage() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  const syncData = {
    lastSuccessfulSync: new Date('2025-07-15T10:30:00'),
    pendingRecords: 3,
    successfullySynced: 156,
    failedRecords: 1,
    conflictedRecords: 0,
  }

  const pendingItems = [
    { id: 'SYNC001', type: 'order', localId: 'ORD-LOCAL-001', status: 'pending', createdAt: new Date('2025-07-15T11:00:00') },
    { id: 'SYNC002', type: 'payment', localId: 'PAY-LOCAL-001', status: 'pending', createdAt: new Date('2025-07-15T11:15:00') },
    { id: 'SYNC003', type: 'credit_transaction', localId: 'CRD-LOCAL-001', status: 'pending', createdAt: new Date('2025-07-15T11:20:00') },
  ]

  const failedItems = [
    { id: 'SYNC004', type: 'order', localId: 'ORD-LOCAL-002', status: 'failed', error: 'Network timeout', createdAt: new Date('2025-07-15T10:45:00') },
  ]

  const handleSyncNow = () => {
    setIsSyncing(true)
    // Simulate sync process
    setTimeout(() => {
      setIsSyncing(false)
    }, 3000)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Sync Status</h1>
        <p className="text-gray-600">Monitor offline transactions and synchronization</p>
      </div>

      {/* Connection Status */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${isOnline ? 'bg-green-100' : 'bg-red-100'}`}>
                {isOnline ? (
                  <Wifi className="w-6 h-6 text-green-600" />
                ) : (
                  <WifiOff className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {isOnline ? 'Online' : 'Offline'}
                </h3>
                <p className="text-sm text-gray-600">
                  Last successful sync: {syncData.lastSuccessfulSync.toLocaleString()}
                </p>
              </div>
            </div>
            <Button
              onClick={handleSyncNow}
              disabled={!isOnline || isSyncing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xl font-bold">{syncData.pendingRecords}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Synced</p>
                <p className="text-xl font-bold">{syncData.successfullySynced}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-xl font-bold">{syncData.failedRecords}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Conflicts</p>
                <p className="text-xl font-bold">{syncData.conflictedRecords}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Progress */}
      {isSyncing && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Syncing records...</span>
                <span>67%</span>
              </div>
              <Progress value={67} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Records */}
      {pendingItems.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pending Records ({pendingItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.type.replace('_', ' ').toUpperCase()}</p>
                    <p className="text-sm text-gray-600">ID: {item.localId}</p>
                    <p className="text-xs text-gray-500">{item.createdAt.toLocaleString()}</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Pending</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed Records */}
      {failedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Failed Records ({failedItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {failedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.type.replace('_', ' ').toUpperCase()}</p>
                    <p className="text-sm text-gray-600">ID: {item.localId}</p>
                    <p className="text-xs text-red-600">{item.error}</p>
                    <p className="text-xs text-gray-500">{item.createdAt.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-red-100 text-red-800">Failed</Badge>
                    <Button variant="outline" size="sm">Retry</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
