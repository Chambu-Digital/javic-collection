'use client'

import { CreditCard, Landmark, Truck, MessageCircle } from 'lucide-react'

const paymentMethods = [
  {
    id: 'mpesa',
    name: 'M-Pesa',
    description: 'Pay via M-Pesa mobile money',
    icon: CreditCard,
  },
  {
    id: 'cod',
    name: 'Cash on Delivery',
    description: 'Pay when you receive your order',
    icon: Truck,
  },
]

export default function PaymentMethodSelector({
  paymentMethod,
  setPaymentMethod,
}: {
  paymentMethod: string
  setPaymentMethod: (method: any) => void
}) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {paymentMethods.map((method) => {
        const Icon = method.icon
        return (
          <button
            key={method.id}
            onClick={() => setPaymentMethod(method.id)}
            className={`p-4 rounded-lg border-2 transition text-left ${
              paymentMethod === method.id
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-start gap-3">
              <Icon className={`w-6 h-6 mt-1 flex-shrink-0 ${
                paymentMethod === method.id ? 'text-primary' : 'text-muted-foreground'
              }`} />
              <div>
                <p className="font-semibold text-card-foreground">
                  {method.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {method.description}
                </p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
