'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2 } from 'lucide-react'

interface Branch {
  _id: string
  name: string
  branchCode: string
  isMainBranch: boolean
}

interface BranchSelectorProps {
  value: string
  onChange: (branchId: string) => void
  includeAllOption?: boolean
  activeOnly?: boolean
  className?: string
  placeholder?: string
}

export default function BranchSelector({
  value,
  onChange,
  includeAllOption = true,
  activeOnly = true,
  className = '',
  placeholder = 'Select branch'
}: BranchSelectorProps) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/branches', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        let filteredBranches = data.branches

        if (activeOnly) {
          filteredBranches = filteredBranches.filter((b: Branch) => b.isMainBranch || true) // In production, filter by isActive
        }

        setBranches(filteredBranches)
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Loading branches..." />
        </SelectTrigger>
      </Select>
    )
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-500" />
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent>
        {includeAllOption && (
          <SelectItem value="all">All Branches</SelectItem>
        )}
        {branches.map((branch) => (
          <SelectItem key={branch._id} value={branch._id}>
            <div className="flex items-center gap-2">
              <span>{branch.name}</span>
              <span className="text-xs text-gray-500">({branch.branchCode})</span>
              {branch.isMainBranch && (
                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                  Main
                </span>
              )}
            </div>
          </SelectItem>
        ))}
        {branches.length === 0 && (
          <SelectItem value="none" disabled>
            No branches available
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  )
}
