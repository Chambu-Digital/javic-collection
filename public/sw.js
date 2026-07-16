const CACHE_NAME = 'javic-pos-v1'
const STATIC_URLS = [
  '/pos',
  '/pos/make-sale',
  '/pos/held-orders',
  '/pos/customers',
  '/pos/credit-accounts',
  '/pos/reports',
  '/pos/sync-status',
  '/pos/settings',
  '/manifest.json',
]

// Install — pre-cache the POS shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_URLS))
      .then(() => self.skipWaiting())
  )
})

// Activate — evict old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.map((name) => name !== CACHE_NAME && caches.delete(name))
      )
    ).then(() => self.clients.claim())
  )
})

// Fetch — only cache GET/HEAD requests; let everything else pass through
self.addEventListener('fetch', (event) => {
  // Never intercept non-GET requests (POST, PUT, DELETE, etc.)
  // The Cache API does not support caching POST requests.
  if (event.request.method !== 'GET') return

  // Don't intercept API calls — always go to the network for fresh data
  const url = new URL(event.request.url)
  if (url.pathname.startsWith('/api/')) return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached

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
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, toCache))
        return response
      })
    })
  )
})

// Background sync — flush offline sales queue
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pos-data') {
    event.waitUntil(syncPosData())
  }
})

async function syncPosData() {
  try {
    const clients = await self.clients.matchAll({ type: 'window' })
    clients.forEach((client) => client.postMessage({ type: 'TRIGGER_SYNC' }))
  } catch (err) {
    console.error('[SW] syncPosData failed', err)
  }
}
