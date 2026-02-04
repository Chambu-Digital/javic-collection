'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUserStore } from '@/lib/user-store'
import GoogleSignInButton from '@/components/auth/google-sign-in-button'
import { useToast } from '@/components/ui/custom-toast'

export default function LoginPage() {
  const router = useRouter()
  const { user } = useUserStore()
  const { success: showSuccessToast, error: showErrorToast } = useToast()
  const [returnTo, setReturnTo] = useState<string>('/')

  // Get return URL from query params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const returnUrl = urlParams.get('returnTo')
    console.log('Login page - URL search params:', window.location.search)
    console.log('Login page - returnTo param:', returnUrl)
    if (returnUrl) {
      const decodedUrl = decodeURIComponent(returnUrl)
      console.log('Login page - decoded returnTo:', decodedUrl)
      setReturnTo(decodedUrl)
    }
  }, [])

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(returnTo)
    }
  }, [user, router, returnTo])

  if (user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary">
            ELECTROMATT
          </Link>
          <p className="text-sm text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold">Welcome Back</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Continue with your Google account to access your orders and preferences
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Google Sign-In */}
            <GoogleSignInButton
              returnTo={returnTo}
              onSuccess={() => {
                showSuccessToast('Welcome back!')
              }}
              onError={(error) => {
                console.error('Login error:', error)
                showErrorToast('Google sign-in failed. Please try again.')
              }}
            />
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link
              href={`/account/register${returnTo !== '/' ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`}
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>
          
          <div className="flex items-center justify-center gap-4 text-sm">
            <Link
              href="/"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              ← Back to store
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link
              href="/track-order"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Track Order
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}