'use client'

import { useState, useEffect } from 'react'

interface Branch {
  _id: string
  name: string
  branchCode: string
  isMainBranch: boolean
  isActive: boolean
}

interface BranchDropdownProps {
  value: string
  onChange: (branchId: string) => void
  required?: boolean
  activeOnly?: boolean
  className?: string
  disabled?: boolean
}

export default function BranchDropdown({
  value,
  onChange,
  required = false,
  activeOnly = true,
  className = '',
  disabled = false
}: BranchDropdownProps) {
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
          filteredBranches = filteredBranches.filter((b: Branch) => b.isActive)
        }

        // Sort: Main branch first, then alphabetically
        filteredBranches.sort((a: Branch, b: Branch) => {
          if (a.isMainBranch && !b.isMainBranch) return -1
          if (!a.isMainBranch && b.isMainBranch) return 1
          return a.name.localeCompare(b.name)
        })

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
      <select className={className} disabled>
        <option>Loading branches...</option>
      </select>
    )
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      disabled={disabled}
      className={className}
    >
      <option value="">Select branch...</option>
      {branches.map((branch) => (
        <option key={branch._id} value={branch._id}>
          {branch.name} ({branch.branchCode})
          {branch.isMainBranch ? ' - Main' : ''}
        </option>
      ))}
    </select>
  )
}
