'use client'

import { useEffect } from 'react'

interface GoogleOAuthProviderProps {
  children: React.ReactNode
}

export default function GoogleOAuthProvider({ children }: GoogleOAuthProviderProps) {
  useEffect(() => {
    // Load Google Sign-In script globally
    if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
  }, [])

  return <>{children}</>
}