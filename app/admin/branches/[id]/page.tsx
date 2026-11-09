'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Building2,
  MapPin,
  Star,
  ArrowLeft,
  Loader2,
  Users,
  Package,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

// Import tab components
import BranchInfoTab from '@/components/admin/branch-detail/branch-info-tab'
import BranchVendorsTab from '@/components/admin/branch-detail/branch-vendors-tab'
import BranchStockTab from '@/components/admin/branch-detail/branch-stock-tab'

interface Branch {
  _id: string
  name: string
  branchCode: string
  location?: string
  address?: string
  isActive: boolean
  isMainBranch: boolean
  createdAt?: string
  updatedAt?: string
}

export default function BranchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [branch, setBranch] = useState<Branch | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')

  useEffect(() => {
    fetchBranch()
  }, [resolvedParams.id])

  const fetchBranch = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/branches/${resolvedParams.id}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setBranch(data)
      } else {
        toast.error('Failed to fetch branch')
        router.push('/admin/branches')
      }
    } catch (error) {
      console.error('Error fetching branch:', error)
      toast.error('Error loading branch')
      router.push('/admin/branches')
    } finally {
      setLoading(false)
    }
  }

  const handleBranchUpdate = (updatedBranch: Branch) => {
    setBranch(updatedBranch)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!branch) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Branch Not Found</h2>
          <Button onClick={() => router.push('/admin/branches')} variant="outline">
            Back to Branches
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/branches')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Branches
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {branch.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="font-mono">
                    {branch.branchCode}
                  </Badge>
                  {branch.isMainBranch && (
                    <Badge className="bg-blue-500 flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Main Branch
                    </Badge>
                  )}
                  {branch.isActive ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
              </div>
            </div>

            {(branch.location || branch.address) && (
              <div className="flex items-start gap-2 text-sm text-gray-600 mt-3">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  {branch.location && <div>{branch.location}</div>}
                  {branch.address && <div className="text-gray-500">{branch.address}</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Information
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Vendors
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Stock
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <BranchInfoTab branch={branch} onUpdate={handleBranchUpdate} />
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <BranchVendorsTab branchId={branch._id} branchName={branch.name} />
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <BranchStockTab branchId={branch._id} branchName={branch.name} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
