import { useState, useEffect } from 'react'

interface ShippingRate {
  county: string
  area: string
  cost: number
}

export function useShippingCost(county?: string, area?: string) {
  const [shippingCost, setShippingCost] = useState<number>(150) // Default shipping cost
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!county || !area) {
      setShippingCost(150) // Default cost if no location specified
      return
    }

    const fetchShippingCost = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // First get county ID by name
        const countyResponse = await fetch('/api/locations/counties')
        
        if (countyResponse.ok) {
          const { counties } = await countyResponse.json()
          const targetCounty = counties.find((c: any) => 
            c.name.toLowerCase() === county.toLowerCase()
          )
          
          if (targetCounty) {
            // Try to get the specific area cost
            const areasResponse = await fetch(`/api/locations/counties/${targetCounty._id}/areas`)
            
            if (areasResponse.ok) {
              const { areas } = await areasResponse.json()
              const targetArea = areas.find((a: any) => 
                a.name.toLowerCase() === area.toLowerCase()
              )
              
              // Use area fee if explicitly set (including 0 for free shipping)
              // Only fall back to county if area fee is not set (undefined/null)
              if (targetArea && targetArea.shippingFee !== undefined && targetArea.shippingFee !== null) {
                setShippingCost(targetArea.shippingFee)
                return
              }
            }
            
            // If area not found, use county default
            if (targetCounty.defaultShippingFee !== undefined) {
              setShippingCost(targetCounty.defaultShippingFee)
              return
            }
          }
        }
        
        // Fallback to default cost
        setShippingCost(150)
        
      } catch (err) {
        console.error('Error fetching shipping cost:', err)
        setError('Failed to calculate shipping cost')
        setShippingCost(150) // Fallback to default
      } finally {
        setLoading(false)
      }
    }

    fetchShippingCost()
  }, [county, area])

  return { shippingCost, loading, error }
}