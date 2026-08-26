'use client'

import { useEffect, useState } from 'react'
import { X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('[PWA] App is already installed')
      return
    }

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedDate = new Date(dismissed)
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
      
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        return
      }
    }

    const handler = (e: Event) => {
      e.preventDefault()
      console.log('[PWA] Install prompt captured')
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Check if iOS
    const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent)
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone
    
    if (isIos && !isInStandaloneMode) {
      // Show iOS install instructions after a delay
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.log('[PWA] No install prompt available')
      return
    }

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log('[PWA] User choice:', outcome)
      
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt')
      } else {
        console.log('[PWA] User dismissed the install prompt')
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error('[PWA] Install failed:', error)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString())
    setShowPrompt(false)
  }

  if (!showPrompt) {
    return null
  }

  // Check if iOS
  const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent)

  if (isIos) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-white border-2 border-pink-600 rounded-lg shadow-xl p-4 z-50 animate-in slide-in-from-bottom">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="pr-6">
          <h3 className="font-semibold text-gray-900 mb-2">Install Javic POS</h3>
          <p className="text-sm text-gray-600 mb-3">
            Install this app on your iPhone: tap{' '}
            <span className="inline-block align-middle mx-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </span>
            (Share button) and then <strong>Add to Home Screen</strong>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white border-2 border-pink-600 rounded-lg shadow-xl p-4 z-50 animate-in slide-in-from-bottom">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <div className="flex-shrink-0 w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
          <Download className="w-6 h-6 text-pink-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">Install Javic POS</h3>
          <p className="text-sm text-gray-600 mb-3">
            Install this app for faster access and offline support
          </p>
          <div className="flex gap-2">
            <Button onClick={handleInstall} size="sm" className="bg-pink-600 hover:bg-pink-700">
              Install App
            </Button>
            <Button onClick={handleDismiss} size="sm" variant="outline">
              Not Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
