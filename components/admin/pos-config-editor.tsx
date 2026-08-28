'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
  Store,
  MapPin,
  ShieldCheck
} from 'lucide-react'

interface Branch {
  _id: string
  name: string
  branchCode: string
  isActive: boolean
}

interface AdminInfo {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

interface PosConfigEditorProps {
  adminInfo: AdminInfo
  currentPosRole?: string
  currentBranchId?: string
  onSave: (posRole: string | undefined, branchId: string | undefined) => Promise<void>
  onCancel: () => void
}

export default function PosConfigEditor({
  adminInfo,
  currentPosRole,
  currentBranchId,
  onSave,
  onCancel
}: PosConfigEditorProps) {
  const [posRole, setPosRole] = useState(currentPosRole || '')
  const [branchId, setBranchId] = useState(currentBranchId || '')
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/admin/branches')
      if (response.ok) {
        const data = await response.json()
        setBranches(data.branches || [])
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      await onSave(
        posRole || undefined,
        branchId || undefined
      )
      setMessage({ type: 'success', text: 'POS configuration updated successfully' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update POS configuration' })
    } finally {
      setSaving(false)
    }
  }

  const posRoles = [
    { value: 'cashier', label: 'Cashier', description: 'Basic sales operations' },
    { value: 'senior_cashier', label: 'Senior Cashier', description: 'Sales + inventory view + credit sales' },
    { value: 'supervisor', label: 'Supervisor', description: 'Full sales + stock adjustments + returns' },
    { value: 'manager', label: 'Manager', description: 'Full access to POS operations' },
    { value: 'administrator', label: 'Administrator', description: 'Complete POS system control' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admins
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">POS Configuration</h2>
          <p className="text-gray-600 mt-1">
            Configure Point of Sale access and branch assignment
          </p>
        </div>
      </div>

      {/* Admin Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Configuring POS for {adminInfo.firstName} {adminInfo.lastName}
              </h3>
              <p className="text-sm text-gray-600">{adminInfo.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            POS Role & Branch Assignment
          </CardTitle>
          <CardDescription>
            Assign a POS role to grant access to the Point of Sale system. Optionally assign a branch to restrict stock adjustments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* POS Role Selection */}
          <div className="space-y-3">
            <Label htmlFor="pos-role" className="text-base font-semibold">
              POS Role
            </Label>
            <Select value={posRole} onValueChange={setPosRole}>
              <SelectTrigger id="pos-role">
                <SelectValue placeholder="Select POS role (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No POS Access</SelectItem>
                {posRoles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{role.label}</span>
                      <span className="text-xs text-gray-500">{role.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              Leave unselected if this user should not have POS access
            </p>
          </div>

          {/* Branch Assignment */}
          {posRole && posRole !== 'none' && (
            <div className="space-y-3">
              <Label htmlFor="branch" className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Assigned Branch
              </Label>
              <Select 
                value={branchId} 
                onValueChange={setBranchId}
                disabled={loading}
              >
                <SelectTrigger id="branch">
                  <SelectValue placeholder={loading ? "Loading branches..." : "Select branch (optional)"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Branch Assignment (All branches)</SelectItem>
                  {branches
                    .filter(b => b.isActive)
                    .map((branch) => (
                      <SelectItem key={branch._id} value={branch._id}>
                        {branch.name} ({branch.branchCode})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  <strong>Branch Assignment:</strong> If assigned, this user will default to this branch in POS stock management 
                  and can only adjust stock for this branch (unless they are a Manager or Administrator).
                </p>
              </div>
            </div>
          )}

          {/* Permission Summary */}
          {posRole && posRole !== 'none' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Permissions for {posRoles.find(r => r.value === posRole)?.label}</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {posRole === 'cashier' && (
                  <>
                    <li>• Make sales and apply small discounts</li>
                    <li>• View customers</li>
                    <li>• Hold orders</li>
                    <li>• View own sales reports</li>
                  </>
                )}
                {posRole === 'senior_cashier' && (
                  <>
                    <li>• All cashier permissions</li>
                    <li>• Wholesale pricing and larger discounts</li>
                    <li>• Create customers</li>
                    <li>• Credit sales and repayments</li>
                    <li>• <strong>View inventory stock levels</strong></li>
                    <li>• View outlet reports</li>
                  </>
                )}
                {posRole === 'supervisor' && (
                  <>
                    <li>• All senior cashier permissions</li>
                    <li>• Price override and approve discounts</li>
                    <li>• Credit management (enable, override limits)</li>
                    <li>• <strong>Adjust inventory stock levels</strong></li>
                    <li>• Process returns and refunds</li>
                    <li>• Resolve sync issues</li>
                  </>
                )}
                {(posRole === 'manager' || posRole === 'administrator') && (
                  <>
                    <li>• <strong>Full POS access</strong></li>
                    <li>• All sales, customer, and inventory operations</li>
                    <li>• All reporting (own, outlet, and company-wide)</li>
                    <li>• Reverse sales and refunds</li>
                    <li>• POS settings configuration</li>
                  </>
                )}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
