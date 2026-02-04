'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/lib/cart-store'
import { useUserStore } from '@/lib/user-store'
import { useShippingCost } from '@/lib/use-shipping'
import { ShoppingCart, MapPin, CreditCard, Truck, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import Image from 'next/image'

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

type PaymentMethod = 'mpesa' | 'cod'

interface CheckoutStepOneProps {
  selectedAddress: Address | null
  onAddressSelect: (address: Address) => void
  selectedPaymentMethod: PaymentMethod | null
  onPaymentMethodSelect: (method: PaymentMethod) => void
  onNext: () => void
  onShippingCostChange?: (cost: number) => void
}

const paymentMethods = [
  {
    id: 'mpesa' as PaymentMethod,
    name: 'M-Pesa',
    description: 'Pay securely with mobile money',
    icon: CreditCard,
  }
]

export default function CheckoutStepOne({
  selectedAddress,
  onAddressSelect,
  selectedPaymentMethod,
  onPaymentMethodSelect,
  onNext,
  onShippingCostChange
}: CheckoutStepOneProps) {
  const { items, getTotalPrice, getItemPricing } = useCartStore()
  const { user } = useUserStore()
  
  const [showCartDetails, setShowCartDetails] = useState(false)
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

  // Get shipping cost for current address
  const currentAddress = selectedAddress || (newAddress.county && newAddress.area ? newAddress : null)
  const { shippingCost, loading: shippingLoading } = useShippingCost(
    currentAddress?.county, 
    currentAddress?.area
  )

  // Notify parent component of shipping cost changes
  useEffect(() => {
    if (!shippingLoading && onShippingCostChange) {
      onShippingCostChange(shippingCost)
    }
  }, [shippingCost, shippingLoading, onShippingCostChange])

  const subtotal = getTotalPrice()
  const taxAmount = 0 // No VAT
  const total = subtotal + shippingCost

  const userAddresses = user?.addresses?.filter(addr => addr.type === 'shipping') || []

  // Load counties on mount
  useEffect(() => {
    fetchCounties()
  }, [])

  // Auto-select M-Pesa since it's the only payment method
  useEffect(() => {
    if (!selectedPaymentMethod && paymentMethods.length === 1) {
      onPaymentMethodSelect(paymentMethods[0].id)
    }
  }, [selectedPaymentMethod, onPaymentMethodSelect])

  // Auto-fill address form and show form if no addresses
  useEffect(() => {
    if (user && counties.length > 0) {
      const userAddresses = user.addresses || []
      const referenceAddress = 
        userAddresses.find(addr => addr.type === 'shipping' && addr.isDefault) ||
        userAddresses.find(addr => addr.type === 'shipping') ||
        userAddresses.find(addr => addr.isDefault) ||
        userAddresses[userAddresses.length - 1]
      
      if (referenceAddress) {
        const autoFillData = {
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '',
          phone: user.phone || '',
          county: referenceAddress.county || '',
          area: referenceAddress.area || ''
        }
        
        setNewAddress(prev => ({ ...prev, ...autoFillData }))
        
        if (referenceAddress.county) {
          const county = counties.find(c => c.name === referenceAddress.county)
          if (county) {
            setSelectedCounty(county._id)
            fetchAreas(county._id)
          }
        }
      } else {
        // No addresses, auto-fill basic info
        setNewAddress(prev => ({
          ...prev,
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '',
          phone: user.phone || ''
        }))
      }
    }
    
    // Show new address form if no saved addresses
    if (!user || userAddresses.length === 0) {
      setShowNewAddressForm(true)
    }
  }, [user, counties])

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
      console.log('Fetching areas for county:', countyId)
      const response = await fetch(`/api/locations/counties/${countyId}/areas`)
      const data = await response.json()
      console.log('Areas fetched:', data.areas)
      setAreas(data.areas || [])
    } catch (error) {
      console.error('Error fetching areas:', error)
      setAreas([])
    }
  }

  const handleCountyChange = (countyId: string) => {
    console.log('County changed to:', countyId)
    setSelectedCounty(countyId)
    const county = counties.find(c => c._id === countyId)
    console.log('County found:', county)
    setNewAddress(prev => ({
      ...prev,
      county: county?.name || '',
      area: '' // Reset area when county changes
    }))
    // Areas will be fetched by useEffect when selectedCounty changes
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
        onAddressSelect(newAddress)
      }
      
      setShowNewAddressForm(false)
    } catch (error) {
      console.error('Error saving address:', error)
    } finally {
      setLoading(false)
    }
  }

  const canProceed = selectedAddress && selectedPaymentMethod

  return (
    <div className="space-y-6">
      {/* Order Summary - Collapsible */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => setShowCartDetails(!showCartDetails)}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Order Summary ({items.length} items)
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">
                {!currentAddress || shippingLoading ? (
                  `KSH ${subtotal.toFixed(2)}+`
                ) : (
                  `KSH ${total.toFixed(2)}`
                )}
              </span>
              {showCartDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </CardTitle>
        </CardHeader>
        
        {showCartDetails && (
          <CardContent className="space-y-4">
            {items.map((item, index) => {
              const pricing = getItemPricing(item)
              return (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="relative w-12 h-12 shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm">{item.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                      {item.selectedScent && <span>Scent: {item.selectedScent}</span>}
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">KSH {pricing.totalPrice.toFixed(2)}</p>
                    {pricing.isWholesale && (
                      <Badge variant="secondary" className="text-xs">Wholesale</Badge>
                    )}
                  </div>
                </div>
              )
            })}
            
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>KSH {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>
                  {!currentAddress ? (
                    <span className="text-muted-foreground">Select address</span>
                  ) : shippingLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : shippingCost === 0 ? (
                    <span className="text-green-600 font-semibold">FREE</span>
                  ) : (
                    `KSH ${shippingCost.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary">
                    {!currentAddress || shippingLoading ? (
                      `KSH ${subtotal.toFixed(2)}+`
                    ) : (
                      `KSH ${total.toFixed(2)}`
                    )}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Shipping Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Shipping Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && userAddresses.length > 0 && (
            <div className="space-y-3">
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
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{address.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {address.phone} • {address.area}, {address.county}
                          </p>
                        </div>
                        {selectedAddress?._id === address._id && (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Shipping</p>
                            <p className="text-sm font-semibold">
                              {shippingLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : shippingCost === 0 ? (
                                <span className="text-green-600">FREE</span>
                              ) : (
                                `KSH ${shippingCost}`
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {!showNewAddressForm ? (
            <Button
              variant="outline"
              onClick={() => setShowNewAddressForm(true)}
              className="w-full"
            >
              {user && userAddresses.length > 0 ? 'Use Different Address' : 'Add Shipping Address'}
            </Button>
          ) : (
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Shipping Address</h3>
                {user && userAddresses.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewAddressForm(false)}
                  >
                    Cancel
                  </Button>
                )}
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

                {/* Shipping Cost Preview */}
                {newAddress.county && newAddress.area && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          Shipping to {newAddress.area}, {newAddress.county}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-blue-900">
                        {shippingLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : shippingCost === 0 ? (
                          <span className="text-green-600">FREE</span>
                        ) : (
                          `KSH ${shippingCost.toFixed(2)}`
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleSaveAddress}
                disabled={loading || !newAddress.name || !newAddress.phone || !newAddress.county || !newAddress.area}
                className="w-full"
              >
                {loading ? 'Saving...' : 'Use This Address'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method */}
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
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {paymentMethods.map((method) => {
              const Icon = method.icon
              const isSelected = selectedPaymentMethod === method.id
              
              return (
                <div key={method.id}>
                  <div
                    className={`p-4 rounded-lg border-2 transition cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => onPaymentMethodSelect(method.id)}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={method.id} id={method.id} />
                      <Icon className={`w-5 h-5 ${
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <div className="flex-1">
                        <Label htmlFor={method.id} className="cursor-pointer">
                          <p className="font-semibold">{method.name}</p>
                          <p className="text-sm text-muted-foreground">{method.description}</p>
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Continue Button */}
      <Button 
        onClick={onNext}
        disabled={!canProceed}
        className="w-full"
        size="lg"
      >
        Review & Place Order →
      </Button>
    </div>
  )
}