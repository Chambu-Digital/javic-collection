'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Truck, MapPin, DollarSign, Clock } from 'lucide-react'
import Link from 'next/link'

interface ShippingStats {
  totalCounties: number
  activeCounties: number
  totalAreas: number
  activeAreas: number
  averageShippingFee: number
  averageDeliveryDays: number
}

export default function ShippingStatsWidget() {
  const [stats, setStats] = useState<ShippingStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [countiesRes, areasRes] = await Promise.all([
        fetch('/api/admin/counties'),
        fetch('/api/admin/areas')
      ])

      if (countiesRes.ok && areasRes.ok) {
        const countiesData = await countiesRes.json()
        const areasData = await areasRes.json()

        const counties = countiesData.counties || []
        const areas = areasData.areas || []

        const activeCounties = counties.filter((c: any) => c.isActive)
        const activeAreas = areas.filter((a: any) => a.isActive)

        const avgShippingFee = activeAreas.length > 0 
          ? Math.round(activeAreas.reduce((sum: number, area: any) => sum + area.shippingFee, 0) / activeAreas.length)
          : 0

        const avgDeliveryDays = activeAreas.length > 0
          ? Math.round(activeAreas.reduce((sum: number, area: any) => sum + area.estimatedDeliveryDays, 0) / activeAreas.length)
          : 0

        setStats({
          totalCounties: counties.length,
          activeCounties: activeCounties.length,
          totalAreas: areas.length,
          activeAreas: activeAreas.length,
          averageShippingFee: avgShippingFee,
          averageDeliveryDays: avgDeliveryDays
        })
      }
    } catch (error) {
      console.error('Error fetching shipping stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Areas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Areas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Failed to load shipping stats</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Shipping Areas
        </CardTitle>
        <CardDescription>
          Manage shipping zones and delivery fees
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Counties</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{stats.activeCounties}</span>
              <Badge variant="outline" className="text-xs">
                {stats.totalCounties} total
              </Badge>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Areas</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{stats.activeAreas}</span>
              <Badge variant="outline" className="text-xs">
                {stats.totalAreas} total
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-gray-600">Avg. Fee</span>
            </div>
            <span className="text-sm font-medium">KES {stats.averageShippingFee}</span>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-gray-600">Avg. Days</span>
            </div>
            <span className="text-sm font-medium">{stats.averageDeliveryDays} days</span>
          </div>
        </div>

        <Link 
          href="/admin/shipping" 
          className="block w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium mt-4"
        >
          Manage Shipping Areas →
        </Link>
      </CardContent>
    </Card>
  )
}