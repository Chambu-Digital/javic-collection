'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Eye, EyeOff, Mail, Lock, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { usePosAuthStore } from '@/lib/pos/pos-auth-store'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export default function PosLoginPage() {
  return (
    <Suspense>
      <PosLoginForm />
    </Suspense>
  )
}

function PosLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('from') || '/pos/make-sale'

  const { login, checkAuth, user, isLoading } = usePosAuthStore()

  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  // Tracks whether we're doing the initial silent session check
  const [checkingSession, setCheckingSession] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  // Silently check for an existing valid POS session on mount
  useEffect(() => {
    checkAuth().finally(() => setCheckingSession(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Already authenticated — redirect without showing the form
  useEffect(() => {
    if (!checkingSession && user) {
      router.replace(redirectTo.startsWith('/pos') ? redirectTo : '/pos/make-sale')
    }
  }, [checkingSession, user, router, redirectTo])

  const onSubmit = async (data: FormData) => {
    setError('')
    const result = await login(data.email, data.password)
    if (result.success) {
      router.replace(redirectTo)
    } else {
      setError(result.error || 'Login failed')
    }
  }

  // Only show the full-screen spinner while doing the initial session probe
  if (checkingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-600" />
      </div>
    )
  }

  // Session existed and redirect is in flight
  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-600" />
      </div>
    )
  }

  // No session — show the login form
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <ShoppingBag className="h-8 w-8 text-primary" />
            <span className="text-2xl font-display font-bold text-primary tracking-tight">
              JAVIC COLLECTION
            </span>
          </div>
          <p className="text-muted-foreground text-sm">Point of Sale Terminal</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle className="text-xl font-bold">Staff Sign In</CardTitle>
            <CardDescription>Sign in to access the POS terminal</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    placeholder="cashier@javiccollection.co.ke"
                    className="pl-10"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    {...register('password')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword
                      ? <EyeOff className="h-4 w-4 text-muted-foreground" />
                      : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting || isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign In to POS'
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Need help? Contact your store manager.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
