const CACHE_NAME = 'javic-pos-v2'
const STATIC_CACHE = 'javic-static-v2'
const API_CACHE = 'javic-api-v2'
const IMAGE_CACHE = 'javic-images-v2'

const STATIC_URLS = [
  '/pos',
  '/pos/',
  '/pos/sale',
  '/pos/login',
  '/pos/checkout',
  '/manifest.json',
  '/javic-logo1.png',
]

const API_CACHE_URLS = [
  '/api/pos/products/search',
  '/api/pos/customers',
  '/api/pos/session',
  '/api/auth/pos-check',
]

// Install — pre-cache the POS shell
self.addEventListener('install', (event) => {
  console.log('[POS SW] Installing service worker v2...')
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[POS SW] Caching static resources')
        return cache.addAll(STATIC_URLS)
      })
    ])
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
  console.log('[POS SW] Activating service worker v2...')
  const currentCaches = [STATIC_CACHE, API_CACHE, IMAGE_CACHE]
  event.waitUntil(
    caches.keys().then((names) => {
      console.log('[POS SW] Found caches:', names)
      return Promise.all(
        names.map((name) => {
          if (!currentCaches.includes(name)) {
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

// Fetch — Smart caching strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Only intercept GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Strategy 1: Cache-first for static assets
  if (url.pathname.startsWith('/pos') && !url.pathname.startsWith('/pos/api')) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE))
    return
  }

  // Strategy 2: Stale-while-revalidate for API calls
  if (url.pathname.startsWith('/api/pos/products') || 
      url.pathname.startsWith('/api/pos/customers') ||
      url.pathname.startsWith('/api/auth/pos-check')) {
    event.respondWith(staleWhileRevalidate(event.request, API_CACHE))
    return
  }

  // Strategy 3: Cache images
  if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
    event.respondWith(cacheFirst(event.request, IMAGE_CACHE))
    return
  }

  // Strategy 4: Network-only for mutations (handled by method check above)
  // Strategy 5: Network-first for critical data
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request, API_CACHE))
    return
  }
})

// Cache-first strategy
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) {
    console.log('[POS SW] Cache hit:', request.url)
    return cached
  }
  
  console.log('[POS SW] Cache miss, fetching:', request.url)
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.error('[POS SW] Fetch failed:', error)
    return new Response('Offline', { status: 503 })
  }
}

// Network-first strategy
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.log('[POS SW] Network failed, trying cache:', request.url)
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }
    throw error
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request)
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const cache = caches.open(cacheName)
      cache.then((c) => c.put(request, response.clone()))
    }
    return response
  }).catch(() => {
    console.log('[POS SW] Network error, using stale cache:', request.url)
  })
  
  return cached || fetchPromise
}

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
