/**
 * Unified Offline Queue System
 * Handles queuing orders when offline and syncing when back online
 */

const DB_NAME = 'javic-unified-offline'
const DB_VERSION = 1
const PENDING_ORDERS_STORE = 'pendingOrders'

interface PendingOrder {
  id: string
  orderData: any
  timestamp: number
  retryCount: number
  lastError?: string
}

// Open IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(PENDING_ORDERS_STORE)) {
        db.createObjectStore(PENDING_ORDERS_STORE, { keyPath: 'id' })
      }
    }
  })
}

// Queue an order for later sync
export async function queueOfflineOrder(orderData: any): Promise<string> {
  const db = await openDB()
  const id = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  const pendingOrder: PendingOrder = {
    id,
    orderData: {
      ...orderData,
      wasOffline: true,
      idempotencyKey: id,
    },
    timestamp: Date.now(),
    retryCount: 0,
  }
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PENDING_ORDERS_STORE, 'readwrite')
    const store = tx.objectStore(PENDING_ORDERS_STORE)
    const request = store.add(pendingOrder)
    
    request.onsuccess = () => resolve(id)
    request.onerror = () => reject(request.error)
  })
}

// Get all pending orders
export async function getPendingOrders(): Promise<PendingOrder[]> {
  const db = await openDB()
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PENDING_ORDERS_STORE, 'readonly')
    const store = tx.objectStore(PENDING_ORDERS_STORE)
    const request = store.getAll()
    
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

// Remove successfully synced order
export async function removePendingOrder(id: string): Promise<void> {
  const db = await openDB()
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PENDING_ORDERS_STORE, 'readwrite')
    const store = tx.objectStore(PENDING_ORDERS_STORE)
    const request = store.delete(id)
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Update order retry info
export async function updatePendingOrder(id: string, updates: Partial<PendingOrder>): Promise<void> {
  const db = await openDB()
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PENDING_ORDERS_STORE, 'readwrite')
    const store = tx.objectStore(PENDING_ORDERS_STORE)
    const getRequest = store.get(id)
    
    getRequest.onsuccess = () => {
      const order = getRequest.result
      if (order) {
        const updated = { ...order, ...updates }
        const putRequest = store.put(updated)
        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () => reject(putRequest.error)
      } else {
        resolve()
      }
    }
    
    getRequest.onerror = () => reject(getRequest.error)
  })
}

// Sync all pending orders
export async function syncPendingOrders(): Promise<{ success: number; failed: number }> {
  const pending = await getPendingOrders()
  let success = 0
  let failed = 0
  
  for (const order of pending) {
    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order.orderData)
      })
      
      if (response.ok) {
        await removePendingOrder(order.id)
        success++
      } else {
        const error = await response.text()
        await updatePendingOrder(order.id, {
          retryCount: order.retryCount + 1,
          lastError: error
        })
        failed++
      }
    } catch (error: any) {
      await updatePendingOrder(order.id, {
        retryCount: order.retryCount + 1,
        lastError: error.message
      })
      failed++
    }
  }
  
  return { success, failed }
}

// Check if online
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine
}

// Listen for online event and auto-sync
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[Offline Queue] Back online, syncing pending orders...')
    syncPendingOrders().then(({ success, failed }) => {
      console.log(`[Offline Queue] Synced ${success} orders, ${failed} failed`)
    })
  })
}
