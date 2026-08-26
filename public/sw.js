const CACHE_NAME = 'javic-pos-v1'
const STATIC_URLS = [
  '/pos',
  '/pos/',
  '/pos/make-sale',
  '/pos/held-orders',
  '/pos/customers',
  '/pos/credit-accounts',
  '/pos/reports',
  '/pos/sync-status',
  '/pos/settings',
  '/manifest.json',
  '/javic-logo1.png',
]

// Install — pre-cache the POS shell
self.addEventListener('install', (event) => {
  console.log('[POS SW] Installing service worker...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[POS SW] Caching POS shell')
        return cache.addAll(STATIC_URLS)
      })
      .then(() => {
        console.log('[POS SW] Skip waiting')
        return self.skipWaiting()
      })
      .catch((err) => {
        console.error('[POS SW] Install failed:', err)
      })
  )
})

// Activate — evict old caches
self.addEventListener('activate', (event) => {
  console.log('[POS SW] Activating service worker...')
  event.waitUntil(
    caches.keys().then((names) => {
      console.log('[POS SW] Found caches:', names)
      return Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[POS SW] Deleting old cache:', name)
            return caches.delete(name)
          }
        })
      )
    }).then(() => {
      console.log('[POS SW] Claiming clients')
      return self.clients.claim()
    })
  )
})

// Fetch — only cache GET/HEAD requests; let everything else pass through
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Only intercept requests within POS scope
  if (!url.pathname.startsWith('/pos')) {
    return
  }

  // Never intercept non-GET requests (POST, PUT, DELETE, etc.)
  if (event.request.method !== 'GET') {
    return
  }

  // Don't intercept API calls — always go to the network for fresh data
  if (url.pathname.startsWith('/api/')) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        console.log('[POS SW] Serving from cache:', url.pathname)
        return cached
      }

      console.log('[POS SW] Fetching from network:', url.pathname)
      return fetch(event.request).then((response) => {
        // Only cache valid same-origin responses
        if (
          !response ||
          response.status !== 200 ||
          response.type !== 'basic'
        ) {
          return response
        }

        const toCache = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          console.log('[POS SW] Caching new resource:', url.pathname)
          cache.put(event.request, toCache)
        })
        return response
      })
    })
  )
})

// Background sync — flush offline sales queue
self.addEventListener('sync', (event) => {
  console.log('[POS SW] Background sync triggered:', event.tag)
  if (event.tag === 'sync-pos-data') {
    event.waitUntil(syncPosData())
  }
})

async function syncPosData() {
  try {
    console.log('[POS SW] Starting sync...')
    const clients = await self.clients.matchAll({ type: 'window' })
    console.log('[POS SW] Found clients:', clients.length)
    clients.forEach((client) => client.postMessage({ type: 'TRIGGER_SYNC' }))
  } catch (err) {
    console.error('[POS SW] syncPosData failed', err)
  }
}

// Message handler for install prompt
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[POS SW] Received SKIP_WAITING message')
    self.skipWaiting()
  }
})

console.log('[POS SW] Service worker loaded')
