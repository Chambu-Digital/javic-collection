'use client'

import { useState } from 'react'
import { DollarSign, Smartphone, CreditCard, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface PaymentAllocation {
  method: 'cash' | 'mpesa' | 'credit'
  amount: number
  reference?: string
}

interface PaymentModalProps {
  totalAmount: number
  customer?: {
    id: string
    name: string
    creditEnabled: boolean
    creditLimit: number
    availableCredit: number
    outstandingBalance: number
  }
  error?: string | null
  onErrorDismiss?: () => void
  onConfirm: (payments: PaymentAllocation[], cashReceived?: number) => void
  onCancel: () => void
}

export default function PaymentModal({ totalAmount, customer, error, onErrorDismiss, onConfirm, onCancel }: PaymentModalProps) {
  const [paymentMode, setPaymentMode] = useState<'single' | 'split'>('single')
  const [singleMethod, setSingleMethod] = useState<'cash' | 'mpesa' | 'credit'>('cash')
  const [splitPayments, setSplitPayments] = useState<PaymentAllocation[]>([])
  const [cashReceived, setCashReceived] = useState<number>(0)
  const [mpesaReference, setMpesaReference] = useState('')

  const totalAllocated = splitPayments.reduce((sum, p) => sum + p.amount, 0)
  const remainingAmount = totalAmount - totalAllocated
  const changeDue = paymentMode === 'single' && singleMethod === 'cash' 
    ? cashReceived - totalAmount 
    : splitPayments.filter(p => p.method === 'cash').reduce((sum, p) => sum + (cashReceived || 0), 0) - splitPayments.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0)

  const handleAddSplitPayment = (method: 'cash' | 'mpesa' | 'credit') => {
    if (remainingAmount <= 0) return
    
    const amount = Math.min(remainingAmount, method === 'credit' && customer ? customer.availableCredit : remainingAmount)
    setSplitPayments([...splitPayments, { method, amount }])
  }

  const handleRemoveSplitPayment = (index: number) => {
    setSplitPayments(splitPayments.filter((_, i) => i !== index))
  }

  const handleUpdateSplitPayment = (index: number, amount: number) => {
    const updated = [...splitPayments]
    updated[index].amount = amount
    setSplitPayments(updated)
  }

  const handleConfirm = () => {
    if (paymentMode === 'single') {
      onConfirm([{ method: singleMethod, amount: totalAmount, reference: mpesaReference }], cashReceived)
    } else {
      onConfirm(splitPayments, cashReceived)
    }
  }

  const canConfirm = paymentMode === 'single' 
    ? (singleMethod === 'cash' ? cashReceived >= totalAmount : true)
    : totalAllocated === totalAmount

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Process Payment</CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error banner — shown when the sale API returns an error */}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex-1 text-sm text-red-700 font-medium">{error}</div>
              {onErrorDismiss && (
                <button
                  type="button"
                  onClick={onErrorDismiss}
                  className="text-red-400 hover:text-red-600 mt-0.5 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Amount Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Amount</span>
              <span className="text-2xl font-bold">KSH {totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Mode */}
          <Tabs value={paymentMode} onValueChange={(v) => setPaymentMode(v as 'single' | 'split')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single Payment</TabsTrigger>
              <TabsTrigger value="split">Split Payment</TabsTrigger>
            </TabsList>

            {/* Single Payment */}
            <TabsContent value="single" className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={singleMethod === 'cash' ? 'default' : 'outline'}
                  onClick={() => setSingleMethod('cash')}
                  className="flex flex-col gap-2 h-24"
                >
                  <DollarSign className="w-6 h-6" />
                  <span>Cash</span>
                </Button>
                <Button
                  variant={singleMethod === 'mpesa' ? 'default' : 'outline'}
                  onClick={() => setSingleMethod('mpesa')}
                  className="flex flex-col gap-2 h-24"
                >
                  <Smartphone className="w-6 h-6" />
                  <span>M-Pesa</span>
                </Button>
                <Button
                  variant={singleMethod === 'credit' ? 'default' : 'outline'}
                  onClick={() => setSingleMethod('credit')}
                  disabled={!customer || !customer.creditEnabled}
                  className="flex flex-col gap-2 h-24"
                >
                  <CreditCard className="w-6 h-6" />
                  <span>Credit</span>
                </Button>
              </div>

              {singleMethod === 'cash' && (
                <div>
                  <Label>Cash Received</Label>
                  <Input
                    type="number"
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                    placeholder="Enter amount received"
                  />
                  {cashReceived >= totalAmount && (
                    <div className="mt-2 text-green-600 font-semibold">
                      Change: KSH {(cashReceived - totalAmount).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {singleMethod === 'mpesa' && (
                <div>
                  <Label>M-Pesa Transaction Reference</Label>
                  <Input
                    value={mpesaReference}
                    onChange={(e) => setMpesaReference(e.target.value)}
                    placeholder="Enter M-Pesa reference (e.g., ABC123XYZ)"
                  />
                </div>
              )}

              {singleMethod === 'credit' && customer && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Credit Limit:</span>
                    <span className="font-medium">KSH {customer.creditLimit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Outstanding:</span>
                    <span className="font-medium text-red-600">KSH {customer.outstandingBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available:</span>
                    <span className="font-medium text-green-600">KSH {customer.availableCredit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span>After this sale:</span>
                    <span className="font-medium">KSH {(customer.availableCredit - totalAmount).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Split Payment */}
            <TabsContent value="split" className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleAddSplitPayment('cash')}
                  disabled={remainingAmount <= 0}
                  className="flex-1 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Cash
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleAddSplitPayment('mpesa')}
                  disabled={remainingAmount <= 0}
                  className="flex-1 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add M-Pesa
                </Button>
                {customer && customer.creditEnabled && (
                  <Button
                    variant="outline"
                    onClick={() => handleAddSplitPayment('credit')}
                    disabled={remainingAmount <= 0}
                    className="flex-1 gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Credit
                  </Button>
                )}
              </div>

              {splitPayments.length > 0 && (
                <div className="space-y-2">
                  {splitPayments.map((payment, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {payment.method === 'cash' && <DollarSign className="w-4 h-4" />}
                          {payment.method === 'mpesa' && <Smartphone className="w-4 h-4" />}
                          {payment.method === 'credit' && <CreditCard className="w-4 h-4" />}
                          <span className="capitalize">{payment.method}</span>
                        </div>
                        {payment.method === 'mpesa' && (
                          <Input
                            className="mt-2"
                            placeholder="M-Pesa reference"
                            value={payment.reference || ''}
                            onChange={(e) => {
                              const updated = [...splitPayments]
                              updated[index].reference = e.target.value
                              setSplitPayments(updated)
                            }}
                          />
                        )}
                      </div>
                      <Input
                        type="number"
                        value={payment.amount}
                        onChange={(e) => handleUpdateSplitPayment(index, parseFloat(e.target.value) || 0)}
                        className="w-32"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSplitPayment(index)}
                        className="text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {splitPayments.some(p => p.method === 'cash') && (
                <div>
                  <Label>Total Cash Received</Label>
                  <Input
                    type="number"
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                    placeholder="Enter total cash received"
                  />
                  {cashReceived > splitPayments.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0) && (
                    <div className="mt-2 text-green-600 font-semibold">
                      Change: KSH {(cashReceived - splitPayments.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0)).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Total Allocated:</span>
                  <span className="font-medium">KSH {totalAllocated.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining:</span>
                  <span className={`font-medium ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    KSH {remainingAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!canConfirm}
              className="flex-1"
            >
              Complete Sale
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
