'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Plus, MapPin } from 'lucide-react'
import { useUserStore } from '@/lib/user-store'

interface County {
  _id: string
  name: string
  code: string
  defaultShippingFee: number
  estimatedDeliveryDays: number
}

interface Area {
  _id: string
  name: string
  countyId: string
}

interface Address {
  _id?: string
  type: 'shipping' | 'billing'
  name: string
  phone: string
  county: string
  area: string
  isDefault: boolean
}

interface AddressStepProps {
  selectedAddress: Address | null
  onAddressSelect: (address: Address) => void
  onNext: () => void
  onBack: () => void
}

export default function AddressStep({ 
  selectedAddress, 
  onAddressSelect, 
  onNext, 
  onBack 
}: AddressStepProps) {
  const { user } = useUserStore()
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [counties, setCounties] = useState<County[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [selectedCounty, setSelectedCounty] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [newAddress, setNewAddress] = useState<Omit<Address, '_id'>>({
    type: 'shipping',
    name: '',
    phone: '',
    county: '',
    area: '',
    isDefault: false
  })

  // Auto-fill new address form with user info when logged in
  useEffect(() => {
    if (user && showNewAddressForm && counties.length > 0) {
      // Get user's most appropriate address for reference
      const userAddresses = user.addresses || []
      // Priority: 1. Default shipping address, 2. Any shipping address, 3. Default address, 4. Most recent address
      const referenceAddress = 
        userAddresses.find(addr => addr.type === 'shipping' && addr.isDefault) ||
        userAddresses.find(addr => addr.type === 'shipping') ||
        userAddresses.find(addr => addr.isDefault) ||
        userAddresses[userAddresses.length - 1] // Most recent
      
      const autoFillData = {
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '',
        phone: user.phone || '',
        county: referenceAddress?.county || '',
        area: referenceAddress?.area || ''
      }
      
      setNewAddress(prev => ({
        ...prev,
        ...autoFillData
      }))
      
      // If we have county info, set up the county selection and fetch areas
      if (referenceAddress?.county) {
        const county = counties.find(c => c.name === referenceAddress.county)
        if (county) {
          setSelectedCounty(county._id)
          fetchAreas(county._id)
        }
      }
    }
  }, [user, showNewAddressForm, counties])

  // Auto-show new address form if user has no saved addresses or is guest
  useEffect(() => {
    const userAddresses = user?.addresses?.filter(addr => addr.type === 'shipping') || []
    if (!user || userAddresses.length === 0) {
      setShowNewAddressForm(true)
    }
  }, [user])

  // Load counties on mount
  useEffect(() => {
    fetchCounties()
  }, [])

  // Load areas when county changes
  useEffect(() => {
    if (selectedCounty) {
      fetchAreas(selectedCounty)
    }
  }, [selectedCounty])

  const fetchCounties = async () => {
    try {
      const response = await fetch('/api/locations/counties')
      const data = await response.json()
      setCounties(data.counties || [])
    } catch (error) {
      console.error('Error fetching counties:', error)
    }
  }

  const fetchAreas = async (countyId: string) => {
    try {
      const response = await fetch(`/api/locations/counties/${countyId}/areas`)
      const data = await response.json()
      setAreas(data.areas || [])
    } catch (error) {
      console.error('Error fetching areas:', error)
    }
  }

  const handleCountyChange = (countyId: string) => {
    setSelectedCounty(countyId)
    const county = counties.find(c => c._id === countyId)
    setNewAddress(prev => ({
      ...prev,
      county: county?.name || '',
      area: '' // Reset area when county changes
    }))
  }

  const handleAreaChange = (areaId: string) => {
    const area = areas.find(a => a._id === areaId)
    setNewAddress(prev => ({
      ...prev,
      area: area?.name || ''
    }))
  }

  const handleSaveAddress = async () => {
    if (!newAddress.name || !newAddress.phone || !newAddress.county || !newAddress.area) {
      return
    }

    setLoading(true)
    try {
      if (user) {
        console.log('Saving address:', newAddress)
        // Save to user's addresses
        const response = await fetch('/api/user/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAddress)
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('Address saved successfully:', data)
          onAddressSelect({ ...newAddress, _id: data.address._id })
          
          // Refresh user data to get updated addresses
          const { refreshUser } = useUserStore.getState()
          await refreshUser()
          console.log('User data refreshed')
        } else {
          const errorData = await response.json()
          console.error('Failed to save address:', errorData)
        }
      } else {
        // Guest checkout - just use the address
        onAddressSelect(newAddress)
      }
      
      setShowNewAddressForm(false)
    } catch (error) {
      console.error('Error saving address:', error)
    } finally {
      setLoading(false)
    }
  }

  const userAddresses = user?.addresses?.filter(addr => addr.type === 'shipping') || []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Shipping Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && userAddresses.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Your saved addresses:</Label>
                {selectedAddress && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                    ✓ Address selected
                  </span>
                )}
              </div>
              <RadioGroup
                value={selectedAddress?._id || ''}
                onValueChange={(value) => {
                  const address = userAddresses.find(addr => addr._id === value)
                  if (address) onAddressSelect(address)
                }}
              >
                {userAddresses.map((address) => (
                  <div key={address._id} className={`flex items-center space-x-2 p-3 border rounded-lg transition-colors ${
                    selectedAddress?._id === address._id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}>
                    <RadioGroupItem value={address._id || ''} id={address._id} />
                    <Label htmlFor={address._id} className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium">{address.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {address.phone} • {address.area}, {address.county}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {address.isDefault && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              Default
                            </span>
                          )}
                          {selectedAddress?._id === address._id && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Selected
                            </span>
                          )}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ) : user ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm mb-2">
                No saved addresses found. Add your first shipping address below.
              </p>
            </div>
          ) : (
            <div className="text-center py-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-muted-foreground text-sm mb-2">
                <strong>Guest Checkout:</strong> Please enter your shipping address for delivery.
              </p>
              <p className="text-xs text-muted-foreground">
                Want to save this address? <a href="/account/login" className="text-primary hover:underline">Sign in</a> or <a href="/account/register" className="text-primary hover:underline">create an account</a>
              </p>
            </div>
          )}

          {!showNewAddressForm ? (
            <Button
              variant="outline"
              onClick={() => setShowNewAddressForm(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              {user && userAddresses.length > 0 ? 'Add New Address' : 'Add Shipping Address'}
            </Button>
          ) : (
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">New Shipping Address</h3>
                  {user && (newAddress.name || newAddress.phone || newAddress.county) && (
                    <p className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded mt-1">
                      ✓ Pre-filled with your saved address information
                      {newAddress.county && ` from ${newAddress.county}`}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewAddressForm(false)}
                >
                  Cancel
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={newAddress.name}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+254 712 345 678"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="county">County</Label>
                    <Select 
                      value={selectedCounty}
                      onValueChange={handleCountyChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select county" />
                      </SelectTrigger>
                      <SelectContent>
                        {counties.map((county) => (
                          <SelectItem key={county._id} value={county._id}>
                            {county.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="area">Area</Label>
                    <Select 
                      value={areas.find(a => a.name === newAddress.area)?._id || ''}
                      onValueChange={handleAreaChange} 
                      disabled={!selectedCounty}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select area" />
                      </SelectTrigger>
                      <SelectContent>
                        {areas.map((area) => (
                          <SelectItem key={area._id} value={area._id}>
                            {area.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveAddress}
                disabled={loading || !newAddress.name || !newAddress.phone || !newAddress.county || !newAddress.area}
                className="w-full"
              >
                {loading ? 'Saving...' : 'Save Address'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Next: Payment Method</span>
          <span>Step 3 of 4</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1 order-2 sm:order-1">
            ← Back to Cart
          </Button>
          <Button 
            onClick={onNext} 
            disabled={!selectedAddress}
            className="flex-1 order-1 sm:order-2"
          >
            Continue to Payment →
          </Button>
        </div>
      </div>
    </div>
  )
}