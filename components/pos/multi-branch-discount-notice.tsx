'use client'

import { AlertTriangle, Building2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface MultiBranchDiscountNoticeProps {
  branchNames: string[]
  className?: string
}

export default function MultiBranchDiscountNotice({ 
  branchNames, 
  className = '' 
}: MultiBranchDiscountNoticeProps) {
  if (branchNames.length <= 1) {
    return null
  }

  return (
    <Alert className={`border-orange-200 bg-orange-50 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-900 font-semibold">
        Multi-Branch Cart
      </AlertTitle>
      <AlertDescription className="text-orange-800 text-sm">
        This cart contains items from <strong>{branchNames.length} branches</strong>:
        <div className="flex flex-wrap gap-1 mt-2">
          {branchNames.map((name, index) => (
            <span 
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-900 rounded text-xs font-medium"
            >
              <Building2 className="w-3 h-3" />
              {name}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs">
          <strong>Note:</strong> General cart discount is unavailable for multi-branch carts. 
          Apply discounts to individual items instead.
        </p>
      </AlertDescription>
    </Alert>
  )
}
