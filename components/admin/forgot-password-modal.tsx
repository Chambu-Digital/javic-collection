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
  Mail,
  Send,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [resetLink, setResetLink] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema)
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    setError('')
    setSuccess(false)
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      console.log('Password reset response:', result) // Debug log
      
      if (response.ok) {
        setSuccess(true)
        // In development, show the reset link
        if (result.resetLink) {
          setResetLink(result.resetLink)
          console.log('Reset link received:', result.resetLink) // Debug log
        } else {
          console.log('No reset link in response - check if NODE_ENV is development')
        }
      } else {
        setError(result.error || 'Failed to send reset email')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    }
  }

  const handleClose = () => {
    setError('')
    setSuccess(false)
    setResetLink('')
    reset()
    onClose()
  }

  const copyResetLink = () => {
    navigator.clipboard.writeText(resetLink)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            Forgot Password
          </DialogTitle>
          <DialogDescription>
            Enter your email address and we'll send you a link to reset your password.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {success ? (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Password reset request processed successfully.
                </AlertDescription>
              </Alert>

              {resetLink ? (
                <div className="space-y-4">
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Development Mode:</strong> In production, this would be sent via email. 
                      Use the link below to reset your password.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Your Password Reset Link:</Label>
                    <div className="p-3 bg-gray-50 border rounded-lg">
                      <div className="flex gap-2 mb-2">
                        <Input 
                          value={resetLink} 
                          readOnly 
                          className="text-xs font-mono"
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={copyResetLink}
                        >
                          Copy
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          onClick={() => window.open(resetLink, '_blank')}
                          className="flex-1"
                        >
                          Open Reset Page
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = resetLink}
                          className="flex-1"
                        >
                          Go to Reset Page
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      💡 Click "Open Reset Page" to reset your password in a new tab, or "Go to Reset Page" to navigate directly.
                    </p>
                  </div>
                </div>
              ) : (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Check Browser Console:</strong> The reset link has been logged to the browser console. 
                    Open Developer Tools (F12) → Console tab to find your reset link.
                  </AlertDescription>
                </Alert>
              )}
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

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}

          {success && (
            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}