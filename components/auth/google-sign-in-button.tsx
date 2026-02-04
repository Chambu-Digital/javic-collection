'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/lib/user-store'
import { useRouter } from 'next/navigation'

declare global {
  interface Window {
    google: any
  }
}

interface GoogleSignInButtonProps {
  returnTo?: string
  onSuccess?: () => void
  onError?: (error: string) => void
  disabled?: boolean
}

export default function GoogleSignInButton({ 
  returnTo = '/',
  onSuccess, 
  onError, 
  disabled = false 
}: GoogleSignInButtonProps) {
  const { loginWithGoogle, isLoading } = useUserStore()
  const router = useRouter()
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)
  
  // Store the returnTo value in a ref to prevent it from changing during re-renders
  const returnToRef = useRef(returnTo)
  
  // Update the ref when returnTo prop changes
  useEffect(() => {
    if (returnTo && returnTo !== '/') {
      returnToRef.current = returnTo
      console.log('GoogleSignInButton - updated returnTo ref:', returnTo)
    }
  }, [returnTo])

  console.log('GoogleSignInButton - returnTo prop:', returnTo)

  useEffect(() => {
    // Check if Google Client ID is available
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set')
      onError?.('Google authentication is not configured')
      return
    }

    // Load Google Sign-In script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.body.appendChild(script)

    script.onload = () => {
      if (window.google && buttonRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          })

          // Render the Google button directly
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            width: buttonRef.current.offsetWidth || 300,
            text: 'continue_with',
            shape: 'rectangular'
          })

          setIsGoogleLoaded(true)
          console.log('Google Sign-In initialized successfully')
        } catch (error) {
          console.error('Failed to initialize Google Sign-In:', error)
          onError?.('Failed to initialize Google Sign-In')
        }
      }
    }

    script.onerror = () => {
      console.error('Failed to load Google Sign-In script')
      onError?.('Failed to load Google Sign-In')
    }

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  const handleGoogleResponse = async (response: any) => {
    try {
      // Don't log the full response as it contains sensitive credential data
      console.log('Google authentication initiated')
      const redirectUrl = returnToRef.current
      console.log('GoogleSignInButton - redirecting to:', redirectUrl)
      const result = await loginWithGoogle(response.credential)
      
      if (result.success) {
        console.log('Google authentication successful')
        onSuccess?.()
        router.push(redirectUrl)
      } else {
        console.error('Google authentication failed:', result.error)
        onError?.(result.error || 'Google sign-in failed')
      }
    } catch (error) {
      console.error('Google sign-in error:', error)
      onError?.('Google sign-in failed')
    }
  }

  // Fallback button for when Google button isn't loaded
  const handleFallbackClick = () => {
    if (window.google) {
      window.google.accounts.id.prompt()
    } else {
      onError?.('Google Sign-In is not available')
    }
  }

  return (
    <div className="w-full">
      {/* Google-rendered button */}
      <div 
        ref={buttonRef} 
        className={`w-full ${!isGoogleLoaded ? 'hidden' : ''}`}
        style={{ minHeight: '40px' }}
      />
      
      {/* Fallback button */}
      {!isGoogleLoaded && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleFallbackClick}
          disabled={disabled || isLoading}
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>
      )}
    </div>
  )
}