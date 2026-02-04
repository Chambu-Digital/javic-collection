'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function SeedPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSeed = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to seed database')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Database Seeding</h1>
        
        <div className="bg-card rounded-lg p-6 border border-border">
          <p className="text-card-foreground mb-6">
            Click the button below to seed your MongoDB database with sample categories and products.
            This will clear existing data and add fresh sample data.
          </p>

          <Button 
            onClick={handleSeed} 
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {loading ? 'Seeding Database...' : 'Seed Database'}
          </Button>

          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Success!</h3>
              <p className="text-green-700">
                {result.message}
              </p>
              <ul className="mt-2 text-sm text-green-600">
                <li>Categories created: {result.categories}</li>
                <li>Products created: {result.products}</li>
              </ul>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="mt-8 bg-card rounded-lg p-6 border border-border">
          <h2 className="text-xl font-semibold mb-4 text-card-foreground">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-card-foreground">
            <li>Make sure your MongoDB connection string is set in .env.local</li>
            <li>Click "Seed Database" to populate with sample data</li>
            <li>Visit your homepage to see the dynamic content</li>
            <li>All products and categories will be fetched from MongoDB</li>
          </ol>
        </div>
      </div>
    </div>
  )
}