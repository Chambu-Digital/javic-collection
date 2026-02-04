'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Key,
  Users,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/user-store'

export default function ResetAllPasswordsPage() {
  const router = useRouter()
  const { user } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState('')

  const handleBulkReset = async () => {
    setLoading(true)
    setError('')
    setResults([])

    try {
      const response = await fetch('/api/admin/fix-passwords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (response.ok) {
        setResults(result.users || [])
      } else {
        setError(result.error || 'Failed to generate reset tokens')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Only super admins can access this page
  if (user?.role !== 'super_admin') {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Only super administrators can access this page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Password Reset</h1>
          <p className="text-gray-600 mt-1">
            Generate password reset tokens for all admin users
          </p>
        </div>
      </div>

      {/* Warning Card */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            Important Notice
          </CardTitle>
        </CardHeader>
        <CardContent className="text-orange-700">
          <p className="mb-3">
            This tool generates password reset tokens for all admin users who might have 
            double-hashed passwords from the previous approval system.
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>This will generate reset tokens for ALL admin and super admin users</li>
            <li>Each user will get a 24-hour reset token</li>
            <li>Users can use these tokens to set new passwords</li>
            <li>This is a one-time fix for the double-hashing issue</li>
          </ul>
        </CardContent>
      </Card>

      {/* Action Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Generate Reset Tokens
          </CardTitle>
          <CardDescription>
            Click the button below to generate password reset tokens for all admin users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleBulkReset} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Reset Tokens...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                Generate Reset Tokens for All Admins
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              Reset Tokens Generated ({results.length} users)
            </CardTitle>
            <CardDescription>
              Share these reset links with the respective admin users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((user, index) => (
                <div key={user.userId} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(user.resetUrl)}
                    >
                      Copy Link
                    </Button>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <code className="text-xs break-all">{user.resetUrl}</code>
                  </div>
                </div>
              ))}
            </div>

            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Next Steps:</strong> Share the reset links with each admin user. 
                They have 24 hours to use these links to set new passwords.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  )
}