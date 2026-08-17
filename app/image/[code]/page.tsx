'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2, ExternalLink, Package, Download } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import Image from 'next/image'

interface ProductData {
  productId: string
  productName: string
  imageUrl: string
  imageIndex: number
  totalImages: number
}

export default function ImageDisplayPage() {
  const params = useParams()
  const code = params?.code as string
  
  const [data, setData] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code) return

    const fetchImageData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const res = await fetch(`/api/image-data/${code}`)
        
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Failed to load image')
        }
        
        const result = await res.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load image')
      } finally {
        setLoading(false)
      }
    }

    fetchImageData()
  }, [code])

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Loading image...</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="w-12 h-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">Image Not Found</h2>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                {error}
              </p>
              <Link href="/">
                <Button>
                  <Package className="w-4 h-4 mr-2" />
                  Browse Products
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Success State */}
        {data && !loading && (
          <div className="space-y-6">
            {/* Product Info Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">{data.productName}</h1>
                    <p className="text-sm text-muted-foreground">
                      Design #{data.imageIndex + 1} of {data.totalImages}
                    </p>
                  </div>
                  <Link href={`/product/${data.productId}`}>
                    <Button variant="outline">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Product
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Image Display Card */}
            <Card>
              <CardContent className="p-0">
                <div className="relative w-full aspect-square bg-gray-50 rounded-lg overflow-hidden">
                  <Image
                    src={data.imageUrl}
                    alt={`${data.productName} - Design ${data.imageIndex + 1}`}
                    fill
                    className="object-contain"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-center">
              <a 
                href={data.imageUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                download
              >
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Image
                </Button>
              </a>
              <Link href={`/product/${data.productId}`}>
                <Button>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Full Product Details
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  )
}
