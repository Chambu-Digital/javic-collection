'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useUserStore } from '@/lib/user-store'
import GoogleSignInButton from '@/components/auth/google-sign-in-button'
import { useToast } from '@/components/ui/custom-toast'

export default function RegisterPage() {
  const router = useRouter()
  const { user } = useUserStore()
  const { success: showSuccessToast, error: showErrorToast } = useToast()
  const [returnTo, setReturnTo] = useState<string>('/')

  // Get return URL from query params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const returnUrl = urlParams.get('returnTo')
    if (returnUrl) {
      setReturnTo(decodeURIComponent(returnUrl))
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
    <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary">
            Electromatt
          </Link>
          <p className="text-muted-foreground mt-2">Create your account to get started</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription>
              Join us with your Google account and enjoy the best electronic products you need.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Google Sign-In Button */}
            <GoogleSignInButton
              returnTo={returnTo}
              onSuccess={() => {
                showSuccessToast('Welcome to Electromatt!')
              }}
              onError={(error) => {
                console.error('Registration error:', error)
                showErrorToast('Google sign-up failed. Please try again.')
              }}
            />

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  href="/account/login"
                  className="text-primary font-medium hover:underline"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← Back to store
          </Link>
        </div>
      </div>
    </div>
  )
}