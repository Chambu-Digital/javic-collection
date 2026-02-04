'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Key,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const simpleResetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

type SimpleResetForm = z.infer<typeof simpleResetSchema>

interface SimpleResetModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SimpleResetModal({ isOpen, onClose }: SimpleResetModalProps) {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<SimpleResetForm>({
    resolver: zodResolver(simpleResetSchema)
  })

  const onSubmit = async (data: SimpleResetForm) => {
    setError('')
    setSuccess(false)
    
    try {
      const response = await fetch('/api/auth/simple-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setSuccess(true)
        setResetEmail(data.email)
        setTimeout(() => {
          handleClose()
        }, 3000)
      } else {
        setError(result.error || 'Failed to reset password')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    }
  }

  const handleClose = () => {
    setError('')
    setSuccess(false)
    setResetEmail('')
    setShowPassword(false)
    setShowConfirmPassword(false)
    reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Key className="h-5 w-5 text-green-600" />
            </div>
            Reset Password
          </DialogTitle>
          <DialogDescription>
            Enter your email and new password to reset your account password immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {success ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Password Reset Successful!</strong><br />
                  Your password for <strong>{resetEmail}</strong> has been updated.
                  You can now login with your new password.
                </AlertDescription>
              </Alert>

              <p className="text-sm text-muted-foreground">
                This window will close automatically in a few seconds...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    className="pl-10"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    className="pl-10 pr-10"
                    {...register('newPassword')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.newPassword && (
                  <p className="text-sm text-destructive">{errors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    className="pl-10 pr-10"
                    {...register('confirmPassword')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Instant Reset:</strong> Your password will be changed immediately. 
                  No email verification required.
                </AlertDescription>
              </Alert>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Reset Password
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}

          {success && (
            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Close & Login
              </Button>
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}