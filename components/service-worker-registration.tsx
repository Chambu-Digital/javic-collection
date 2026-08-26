'use client'

import { useEffect } from 'react'

export function SwRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        // Register service worker with POS scope
        navigator.serviceWorker.register('/sw.js', { scope: '/pos/' })
          .then((registration) => {
            console.log('[POS PWA] Service Worker registered:', registration.scope)
            
            // Check for updates periodically
            setInterval(() => {
              registration.update()
            }, 60000) // Check every minute
          })
          .catch((registrationError) => {
            console.error('[POS PWA] Service Worker registration failed:', registrationError)
          })
      })
    } else {
      console.warn('[POS PWA] Service Workers not supported in this browser')
    }
  }, [])

  return null
}
