'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Printer, ShoppingCart, Send, Phone, Check, Loader2, X } from 'lucide-react'

interface ReceiptData {
  orderNumber: string
  orderId: string
  total: number
  paymentAllocations: Array<{
    method: string
    amount: number
    cashReceived?: number
    changeGiven?: number
    mpesaReference?: string
    mpesaPhone?: string
  }>
  cashierName: string
  items: Array<{
    productId: string
    name: string
    image: string | null
    price: number
    quantity: number
    size: string
  }>
}

// ─── Send Modal ───────────────────────────────────────────────────────────────

function SendModal({
  receipt,
  onClose,
}: {
  receipt: ReceiptData
  onClose: () => void
}) {
  const [phone, setPhone] = useState('')
  const [sent, setSent] = useState(false)

  const formatReceiptMessage = () => {
    const date = new Date().toLocaleString('en-KE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

    const itemLines = receipt.items
      .map(i => `• ${i.name}${i.size !== 'One Size' ? ` (${i.size})` : ''} x${i.quantity} — KSh ${((i.resolvedPrice ?? i.price) * i.quantity).toLocaleString()}`)
      .join('\n')

    const paymentLines = receipt.paymentAllocations
      .map(p => {
        let line = `• ${p.method}: KSh ${p.amount.toLocaleString()}`
        if (p.mpesaReference) line += ` (Ref: ${p.mpesaReference})`
        return line
      })
      .join('\n')

    return `🧾 *JAVIC COLLECTION*
*Receipt: ${receipt.orderNumber}*
📅 ${date}
👤 Cashier: ${receipt.cashierName}

*Items:*
${itemLines}

*Payment:*
${paymentLines}

*Total: KSh ${receipt.total.toLocaleString()}*

Thank you for shopping with us! 🙏`
  }

  const handleSend = () => {
    if (!phone.trim()) return

    // Format phone for WhatsApp
    let waPhone = phone.replace(/\s+/g, '').replace(/^\+/, '')
    if (waPhone.startsWith('0')) waPhone = '254' + waPhone.slice(1)
    if (!waPhone.startsWith('254')) waPhone = '254' + waPhone

    const message = formatReceiptMessage()
    const encoded = encodeURIComponent(message)
    window.open(`https://wa.me/${waPhone}?text=${encoded}`, '_blank')
    setSent(true)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-gray-900">Send Receipt</h3>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {sent ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-7 h-7 text-green-600" />
              </div>
              <p className="font-semibold text-gray-900 mb-1">WhatsApp opened!</p>
              <p className="text-sm text-gray-500 mb-5">Send the message to complete delivery.</p>
              <button
                onClick={onClose}
                className="w-full py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Enter the customer's WhatsApp number to send the receipt.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="07XX XXX XXX"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={!phone.trim()}
                  className="flex-1 py-2.5 bg-[#25D366] text-white rounded-lg text-sm font-bold hover:bg-[#20b858] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send via WhatsApp
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReceiptPage() {
  const router = useRouter()
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [showSendModal, setShowSendModal] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const data = sessionStorage.getItem('pos-receipt')
    if (!data) {
      router.replace('/pos/make-sale')
      return
    }
    try {
      setReceipt(JSON.parse(data))
    } catch {
      router.replace('/pos/make-sale')
    }
  }, [router])

  if (!receipt) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  const handleNewSale = () => {
    sessionStorage.removeItem('pos-receipt')
    router.push('/pos/make-sale')
  }

  const handlePrint = () => {
    window.print()
  }

  const date = new Date().toLocaleString('en-KE', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-content, #receipt-content * { visibility: visible; }
          #receipt-content {
            position: fixed;
            left: 0;
            top: 0;
            width: 80mm;
            font-size: 12px;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-md mx-auto space-y-5">

        {/* Success Banner */}
        <div className="bg-emerald-600 text-white rounded-2xl p-6 text-center no-print">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-1">Sale Complete!</h1>
          <p className="text-emerald-100 text-sm">{receipt.orderNumber}</p>
        </div>

        {/* Receipt */}
        <div
          id="receipt-content"
          ref={printRef}
          className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
        >
          {/* Receipt Header */}
          <div className="text-center px-6 py-5 border-b border-dashed border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">JAVIC COLLECTION</h2>
            <p className="text-xs text-gray-500 mt-1">{date}</p>
            <p className="text-xs text-gray-500">Cashier: {receipt.cashierName}</p>
            <p className="text-xs font-mono text-gray-400 mt-1">{receipt.orderNumber}</p>
          </div>

          {/* Items */}
          <div className="px-6 py-4 border-b border-dashed border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Items</p>
            <div className="space-y-2.5">
              {receipt.items.map((item, idx) => (
                <div key={idx} className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.size !== 'One Size' ? `${item.size} · ` : ''}
                      x{item.quantity} @ KSh {(item.resolvedPrice ?? item.price).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                    KSh {((item.resolvedPrice ?? item.price) * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="px-6 py-4 border-b border-dashed border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment</p>
            <div className="space-y-2">
              {receipt.paymentAllocations.map((p, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{p.method}</span>
                    <span className="font-medium">KSh {p.amount.toLocaleString()}</span>
                  </div>
                  {p.mpesaReference && (
                    <p className="text-xs text-gray-400 mt-0.5">Ref: {p.mpesaReference}</p>
                  )}
                  {p.cashReceived && p.cashReceived > p.amount && (
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-0.5">
                      <span>Change given:</span>
                      <span>KSh {(p.cashReceived - p.amount).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-gray-900">Total Paid</span>
              <span className="text-xl font-bold text-emerald-600">KSh {receipt.total.toLocaleString()}</span>
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">
              Thank you for shopping with us! 🙏
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3 no-print pb-6">
          <button
            onClick={handlePrint}
            className="flex flex-col items-center gap-2 py-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            <Printer className="w-6 h-6 text-gray-600" />
            <span className="text-xs font-medium text-gray-700">Print</span>
          </button>

          <button
            onClick={() => setShowSendModal(true)}
            className="flex flex-col items-center gap-2 py-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            <Send className="w-6 h-6 text-[#25D366]" />
            <span className="text-xs font-medium text-gray-700">Send</span>
          </button>

          <button
            onClick={handleNewSale}
            className="flex flex-col items-center gap-2 py-4 bg-emerald-600 border border-emerald-600 rounded-xl hover:bg-emerald-700 transition"
          >
            <ShoppingCart className="w-6 h-6 text-white" />
            <span className="text-xs font-medium text-white">New Sale</span>
          </button>
        </div>
      </div>

      {/* Send Modal */}
      {showSendModal && (
        <SendModal
          receipt={receipt}
          onClose={() => setShowSendModal(false)}
        />
      )}
    </>
  )
}
