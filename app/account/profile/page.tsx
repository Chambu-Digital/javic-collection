'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useUserStore } from '@/lib/user-store'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
// Remove hardcoded locations import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional()
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

const addressSchema = z.object({
  type: z.enum(['shipping', 'billing']),
  name: z.string().min(1, 'Full name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  county: z.string().min(1, 'County is required'),
  area: z.string().min(1, 'Area is required'),
  isDefault: z.boolean().default(false)
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>
type AddressForm = z.infer<typeof addressSchema>

interface Address {
  _id?: string
  type: 'shipping' | 'billing'
  name: string
  phone: string
  county: string
  area: string
  isDefault: boolean
}

export default function ProfilePage() {
  const { user } = useUserStore()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [editingAddress, setEditingAddress] = useState<string | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [availableAreas, setAvailableAreas] = useState<any[]>([])
  const [counties, setCounties] = useState<any[]>([])
  const [loadingCounties, setLoadingCounties] = useState(false)
  const [loadingAreas, setLoadingAreas] = useState(false)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: ''
    }
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema)
  })

  const addressForm = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      type: 'shipping',
      isDefault: false
    }
  })

  // Watch county changes to update areas
  const watchedCounty = addressForm.watch('county')

  useEffect(() => {
    fetchAddresses()
    fetchCounties()
  }, [])

  const fetchCounties = async () => {
    setLoadingCounties(true)
    try {
      const response = await fetch('/api/locations/counties')
      
      if (response.ok) {
        const data = await response.json()
        setCounties(data.counties || [])
      }
    } catch (error) {
      console.error('Error fetching counties:', error)
    } finally {
      setLoadingCounties(false)
    }
  }

  const fetchAreas = async (countyId: string) => {
    if (!countyId) return
    
    setLoadingAreas(true)
    
    try {
      const response = await fetch(`/api/locations/counties/${countyId}/areas`)
      
      if (response.ok) {
        const data = await response.json()
        setAvailableAreas(data.areas || [])
      } else {
        setAvailableAreas([])
      }
    } catch (error) {
      console.error('Error fetching areas:', error)
      setAvailableAreas([])
    } finally {
      setLoadingAreas(false)
    }
  }

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/user/addresses')
      if (response.ok) {
        const data = await response.json()
        setAddresses(data.addresses || [])
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
    }
  }

  const onUpdateProfile = async (data: ProfileForm) => {
    setLoading(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully' })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to update profile' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  const onChangePassword = async (data: PasswordForm) => {
    setLoading(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully' })
        passwordForm.reset()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to change password' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  const onSaveAddress = async (data: AddressForm) => {
    setLoading(true)
    setMessage(null)
    
    try {
      const url = editingAddress ? `/api/user/addresses/${editingAddress}` : '/api/user/addresses'
      const method = editingAddress ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (response.ok) {
        setMessage({ type: 'success', text: `Address ${editingAddress ? 'updated' : 'added'} successfully` })
        fetchAddresses()
        setShowAddressForm(false)
        setEditingAddress(null)
        addressForm.reset()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to save address' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  const deleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return
    
    setLoading(true)
    setMessage(null)
    
    try {
      const response = await fetch(`/api/user/addresses/${addressId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Address deleted successfully' })
        fetchAddresses()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to delete address' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  const editAddress = (address: Address) => {
    setEditingAddress(address._id || '')
    addressForm.reset(address)
    setShowAddressForm(true)
    
    // If editing an address with a county, fetch its areas
    if (address.county && counties.length > 0) {
      const county = counties.find(c => c.name === address.county)
      if (county) {
        fetchAreas(county._id)
      }
    }
  }

  if (!user) return null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile & Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your personal information and preferences
        </p>
      </div>

      {/* Messages */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    {...profileForm.register('firstName')}
                  />
                  {profileForm.formState.errors.firstName && (
                    <p className="text-sm text-destructive">
                      {profileForm.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    {...profileForm.register('lastName')}
                  />
                  {profileForm.formState.errors.lastName && (
                    <p className="text-sm text-destructive">
                      {profileForm.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-10"
                    {...profileForm.register('email')}
                  />
                </div>
                {profileForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {profileForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    className="pl-10"
                    placeholder="+254 700 000 000"
                    {...profileForm.register('phone')}
                  />
                </div>
                {profileForm.formState.errors.phone && (
                  <p className="text-sm text-destructive">
                    {profileForm.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...passwordForm.register('currentPassword')}
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...passwordForm.register('newPassword')}
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...passwordForm.register('confirmPassword')}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Addresses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Saved Addresses
              </CardTitle>
              <CardDescription>
                Manage your shipping and billing addresses
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setEditingAddress(null)
                addressForm.reset({ type: 'shipping', isDefault: false })
                setAvailableAreas([]) // Clear areas when adding new address
                setLoadingAreas(false) // Reset loading state
                setShowAddressForm(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddressForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={addressForm.handleSubmit(onSaveAddress)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Enter your full name"
                        className="pl-10"
                        {...addressForm.register('name')}
                      />
                    </div>
                    {addressForm.formState.errors.name && (
                      <p className="text-sm text-destructive">
                        {addressForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressPhone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="addressPhone"
                        type="tel"
                        placeholder="+254 700 000 000"
                        className="pl-10"
                        {...addressForm.register('phone')}
                      />
                    </div>
                    {addressForm.formState.errors.phone && (
                      <p className="text-sm text-destructive">
                        {addressForm.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="county">County</Label>

                      
                      <Select
                        value={(() => {
                          const countyName = addressForm.watch('county')
                          const county = counties.find(c => c.name === countyName)
                          return county?._id || ''
                        })()}
                        onValueChange={(value) => {
                          // Find county name from ID for form storage
                          const selectedCounty = counties.find(c => c._id === value)
                          if (selectedCounty) {
                            addressForm.setValue('county', selectedCounty.name)
                            addressForm.setValue('area', '') // Reset area when county changes
                            // Clear previous areas and fetch new ones
                            setAvailableAreas([])
                            // Immediately fetch areas
                            fetchAreas(value)
                          }
                        }}
                        disabled={loadingCounties}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingCounties ? "Loading counties..." : "Select county"} />
                        </SelectTrigger>
                        <SelectContent>
                          {counties.map((county) => (
                            <SelectItem key={county._id} value={county._id}>
                              {county.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {addressForm.formState.errors.county && (
                        <p className="text-sm text-destructive">
                          {addressForm.formState.errors.county.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="area">Area</Label>
                      <Select
                        value={(() => {
                          const areaName = addressForm.watch('area')
                          const area = availableAreas.find(a => a.name === areaName)
                          return area?._id || ''
                        })()}
                        onValueChange={(value) => {
                          // Find area name from ID for form storage
                          const selectedArea = availableAreas.find(a => a._id === value)
                          if (selectedArea) {
                            addressForm.setValue('area', selectedArea.name)
                          }
                        }}
                        disabled={!watchedCounty || loadingAreas}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            loadingAreas ? "Loading areas..." : 
                            !watchedCounty ? "Select county first" :
                            availableAreas.length === 0 ? "No areas available" :
                            "Select area"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {availableAreas.map((area) => (
                            <SelectItem key={area._id} value={area._id}>
                              {area.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {addressForm.formState.errors.area && (
                        <p className="text-sm text-destructive">
                          {addressForm.formState.errors.area.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressPhone">Phone (Optional)</Label>
                    <Input
                      id="addressPhone"
                      type="tel"
                      {...addressForm.register('phone')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                      <Button type="submit" disabled={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Address
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAddressForm(false)
                          setEditingAddress(null)
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((address) => (
              <Card key={address._id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={address.type === 'shipping' ? 'default' : 'secondary'}>
                        {address.type.charAt(0).toUpperCase() + address.type.slice(1)}
                      </Badge>
                      {address.isDefault && (
                        <Badge variant="outline" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editAddress(address)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAddress(address._id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{address.name}</p>
                    <p className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {address.phone}
                    </p>
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {address.area}, {address.county}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {addresses.length === 0 && !showAddressForm && (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses saved</h3>
              <p className="text-gray-500 mb-4">
                Add your shipping and billing addresses for faster checkout
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}