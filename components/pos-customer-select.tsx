'use client'

/**
 * Unified POS Customer Selection Component
 * Allows attaching customer to POS sale for tracking and credit
 */

import { useState, useEffect } from 'react'
import { Search, User, X, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCartStore } from '@/lib/cart-store'

interface Customer {
  _id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  creditEnabled?: boolean
  creditLimit?: number
  outstandingBalance?: number
  availableCredit?: number
}

interface PosCustomerSelectProps {
  open: boolean
  onClose: () => void
}

export default function PosCustomerSelect({ open, onClose }: PosCustomerSelectProps) {
  const { setPosContext, customerId, customerName } = useCartStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Load customers on search
  useEffect(() => {
    if (!open) return
    
    const loadCustomers = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          ...(searchQuery && { search: searchQuery }),
          limit: '20'
        })
        
        const response = await fetch(`/api/pos/customers?${params}`)
        const data = await response.json()
        
        setCustomers(data.customers || [])
      } catch (error) {
        console.error('Failed to load customers:', error)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(loadCustomers, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, open])

  const handleSelectCustomer = (customer: Customer) => {
    setPosContext({
      customerId: customer._id,
      customerName: `${customer.firstName} ${customer.lastName}`
    })
    setSelectedCustomer(customer)
    onClose()
  }

  const handleRemoveCustomer = () => {
    setPosContext({
      customerId: undefined,
      customerName: undefined
    })
    setSelectedCustomer(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Select Customer
          </DialogTitle>
        </DialogHeader>

        {/* Current Customer */}
        {customerId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-blue-900">{customerName}</p>
              <p className="text-sm text-blue-700">Current customer</p>
            </div>
            <Button
              onClick={handleRemoveCustomer}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="pl-10 h-12"
            autoFocus
          />
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No customers found</p>
              {searchQuery && (
                <p className="text-sm mt-2">Try a different search term</p>
              )}
            </div>
          ) : (
            customers.map((customer) => (
              <button
                key={customer._id}
                onClick={() => handleSelectCustomer(customer)}
                className="w-full text-left p-4 bg-white border rounded-lg hover:border-primary hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {customer.firstName} {customer.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{customer.email}</p>
                    {customer.phone && (
                      <p className="text-sm text-gray-600">{customer.phone}</p>
                    )}
                  </div>
                  
                  {customer.creditEnabled && (
                    <div className="text-right">
                      <p className="text-xs font-medium text-blue-600">Credit Enabled</p>
                      {customer.availableCredit !== undefined && (
                        <p className="text-sm text-gray-700">
                          Available: KSH {customer.availableCredit.toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Quick Add Walk-in Customer */}
        <Button
          onClick={() => {
            setPosContext({
              customerId: undefined,
              customerName: 'Walk-in Customer'
            })
            onClose()
          }}
          variant="outline"
          className="w-full"
        >
          <User className="w-4 h-4 mr-2" />
          Continue as Walk-in Customer
        </Button>
      </DialogContent>
    </Dialog>
  )
}
