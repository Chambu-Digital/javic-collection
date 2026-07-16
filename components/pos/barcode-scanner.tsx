'use client'

import { useState, useEffect, useRef } from 'react'
import { Camera, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface BarcodeScannerProps {
  isOpen: boolean
  onClose: () => void
  onScan: (barcode: string) => void
}

export default function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (isOpen) {
      startScanner()
    } else {
      stopScanner()
    }

    return () => stopScanner()
  }, [isOpen])

  const startScanner = async () => {
    setLoading(true)
    setError(null)

    try {
      // Check if camera is available
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      // TODO: Integrate actual barcode scanning library like html5-qrcode
      // For now, this is a placeholder that simulates scanning
      setTimeout(() => {
        // Simulate a successful scan after 2 seconds
        // In production, use a real barcode scanner library
        setLoading(false)
      }, 2000)
    } catch (err) {
      setError('Camera access denied or not available')
      setLoading(false)
    }
  }

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
  }

  const handleManualInput = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const barcode = formData.get('barcode') as string
    if (barcode) {
      onScan(barcode)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan Barcode
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera View */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <p className="text-white text-sm text-center px-4">{error}</p>
              </div>
            )}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
            {/* Scanning line animation */}
            {!loading && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-red-500 animate-pulse" />
              </div>
            )}
          </div>

          {/* Manual Input Fallback */}
          <div className="text-center text-sm text-gray-600">
            Or enter barcode manually
          </div>

          <form onSubmit={handleManualInput} className="flex gap-2">
            <input
              name="barcode"
              type="text"
              placeholder="Enter barcode or SKU"
              className="flex-1 px-3 py-2 border rounded-md"
              autoFocus
            />
            <Button type="submit">Scan</Button>
          </form>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
