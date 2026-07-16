'use client'

const DB_NAME = 'javic-pos'
const DB_VERSION = 1

export type OfflineStore =
  | 'products'
  | 'customers'
  | 'heldOrders'
  | 'pendingSales'
  | 'syncQueue'
  | 'meta'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('products')) db.createObjectStore('products', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('customers')) db.createObjectStore('customers', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('heldOrders')) db.createObjectStore('heldOrders', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('pendingSales')) db.createObjectStore('pendingSales', { keyPath: 'clientId' })
      if (!db.objectStoreNames.contains('syncQueue')) db.createObjectStore('syncQueue', { keyPath: 'clientId' })
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' })
    }
  })
}

export async function offlineSet<T>(store: OfflineStore, key: string, value: T): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).put({ ...(value as object), id: key, key })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function offlineGet<T>(store: OfflineStore, key: string): Promise<T | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const req = tx.objectStore(store).get(key)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

export async function offlineGetAll<T>(store: OfflineStore): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const req = tx.objectStore(store).getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}

export async function offlineDelete(store: OfflineStore, key: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function setLastSyncTime(): Promise<void> {
  await offlineSet('meta', 'lastSync', { key: 'lastSync', timestamp: new Date().toISOString() })
}

export async function getLastSyncTime(): Promise<string | null> {
  const meta = await offlineGet<{ timestamp: string }>('meta', 'lastSync')
  return meta?.timestamp || null
}

export async function cacheProducts(products: unknown[]): Promise<void> {
  const db = await openDB()
  const tx = db.transaction('products', 'readwrite')
  const store = tx.objectStore('products')
  store.clear()
  for (const p of products) {
    store.put({ ...(p as object), id: (p as { _id: string })._id })
  }
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  await setLastSyncTime()
}

export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server'
  let id = localStorage.getItem('javic-pos-device-id')
  if (!id) {
    id = `dev-${crypto.randomUUID()}`
    localStorage.setItem('javic-pos-device-id', id)
  }
  return id
}

export async function queueOfflineSale(clientId: string, payload: unknown): Promise<void> {
  await offlineSet('syncQueue', clientId, { clientId, payload, status: 'pending', createdAt: new Date().toISOString() })
  await offlineSet('pendingSales', clientId, { clientId, payload, createdAt: new Date().toISOString() })
}

export async function getSyncQueue() {
  return offlineGetAll<{ clientId: string; payload: unknown; status: string; createdAt: string }>('syncQueue')
}

export async function clearSyncedItem(clientId: string): Promise<void> {
  await offlineDelete('syncQueue', clientId)
  await offlineDelete('pendingSales', clientId)
}
