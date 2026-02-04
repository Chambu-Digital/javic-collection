'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { CreditCard, Truck } from 'lucide-react'

type PaymentMethod = 'mpesa' | 'cod'

interface PaymentStepProps {
  selectedPaymentMethod: PaymentMethod | null
  onPaymentMethodSelect: (method: PaymentMethod) => void
  onNext: () => void
  onBack: () => void
}

const paymentMethods = [
  {
    id: 'mpesa' as PaymentMethod,
    name: 'M-Pesa',
    description: 'Pay securely with M-Pesa mobile money',
    icon: CreditCard,
    details: 'You will receive an M-Pesa prompt on your phone to complete the payment.'
  },
  {
    id: 'cod' as PaymentMethod,
    name: 'Cash on Delivery',
    description: 'Pay when you receive your order',
    icon: Truck,
    details: 'Pay in cash when your order is delivered to your address.'
  }
]

export default function PaymentStep({
  selectedPaymentMethod,
  onPaymentMethodSelect,
  onNext,
  onBack
}: PaymentStepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedPaymentMethod || ''}
            onValueChange={(value) => onPaymentMethodSelect(value as PaymentMethod)}
            className="space-y-4"
          >
            {paymentMethods.map((method) => {
              const Icon = method.icon
              const isSelected = selectedPaymentMethod === method.id
              
              return (
                <div key={method.id} className="space-y-2">
                  <div
                    className={`p-4 rounded-lg border-2 transition cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => onPaymentMethodSelect(method.id)}
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value={method.id} id={method.id} className="mt-1" />
                      <Icon className={`w-6 h-6 mt-0.5 shrink-0 ${
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <div className="flex-1">
                        <Label htmlFor={method.id} className="cursor-pointer">
                          <div>
                            <p className="font-semibold text-card-foreground">
                              {method.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {method.description}
                            </p>
                          </div>
                        </Label>
                      </div>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="ml-8 sm:ml-12 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        {method.details}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Next: Order Review</span>
          <span>Step 4 of 4</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1 order-2 sm:order-1">
            ← Back to Address
          </Button>
          <Button 
            onClick={onNext} 
            disabled={!selectedPaymentMethod}
            className="flex-1 order-1 sm:order-2"
          >
            Review Order →
          </Button>
        </div>
      </div>
    </div>
  )
}