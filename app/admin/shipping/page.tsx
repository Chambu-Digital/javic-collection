'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface County {
  _id: string
  name: string
  code: string
  defaultShippingFee: number
  estimatedDeliveryDays: number
  isActive: boolean
}

interface Area {
  _id: string
  name: string
  countyId: string | { _id: string; name: string; code: string }
  countyName: string
  shippingFee: number
  estimatedDeliveryDays: number
  isActive: boolean
}

export default function ShippingAreasPage() {
  const [counties, setCounties] = useState<County[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCounty, setSelectedCounty] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // County form state
  const [countyDialogOpen, setCountyDialogOpen] = useState(false)
  const [editingCounty, setEditingCounty] = useState<County | null>(null)
  const [countyForm, setCountyForm] = useState({
    name: '',
    code: '',
    defaultShippingFee: '',
    estimatedDeliveryDays: '',
    isActive: true
  })

  // Area form state
  const [areaDialogOpen, setAreaDialogOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const [areaForm, setAreaForm] = useState({
    name: '',
    countyId: '',
    shippingFee: '',
    estimatedDeliveryDays: '',
    isActive: true
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [countiesRes, areasRes] = await Promise.all([
        fetch('/api/admin/counties'),
        fetch('/api/admin/areas')
      ])

      if (countiesRes.ok) {
        const countiesData = await countiesRes.json()
        setCounties(countiesData.counties)
      }

      if (areasRes.ok) {
        const areasData = await areasRes.json()
        setAreas(areasData.areas)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load shipping areas')
    } finally {
      setLoading(false)
    }
  }

  const handleCountySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingCounty 
        ? `/api/admin/counties/${editingCounty._id}`
        : '/api/admin/counties'
      
      const method = editingCounty ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: countyForm.name,
          code: countyForm.code,
          defaultShippingFee: Number(countyForm.defaultShippingFee),
          estimatedDeliveryDays: Number(countyForm.estimatedDeliveryDays),
          isActive: countyForm.isActive
        })
      })

      if (response.ok) {
        toast.success(editingCounty ? 'County updated successfully' : 'County created successfully')
        setCountyDialogOpen(false)
        resetCountyForm()
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save county')
      }
    } catch (error) {
      console.error('Error saving county:', error)
      toast.error('Failed to save county')
    }
  }

  const handleAreaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingArea 
        ? `/api/admin/areas/${editingArea._id}`
        : '/api/admin/areas'
      
      const method = editingArea ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: areaForm.name,
          countyId: areaForm.countyId,
          shippingFee: Number(areaForm.shippingFee),
          estimatedDeliveryDays: Number(areaForm.estimatedDeliveryDays),
          isActive: areaForm.isActive
        })
      })

      if (response.ok) {
        toast.success(editingArea ? 'Area updated successfully' : 'Area created successfully')
        setAreaDialogOpen(false)
        resetAreaForm()
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save area')
      }
    } catch (error) {
      console.error('Error saving area:', error)
      toast.error('Failed to save area')
    }
  }

  const deleteCounty = async (county: County) => {
    if (!confirm(`Are you sure you want to delete ${county.name}?`)) return

    try {
      const response = await fetch(`/api/admin/counties/${county._id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('County deleted successfully')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete county')
      }
    } catch (error) {
      console.error('Error deleting county:', error)
      toast.error('Failed to delete county')
    }
  }

  const deleteArea = async (area: Area) => {
    if (!confirm(`Are you sure you want to delete ${area.name}?`)) return

    try {
      const response = await fetch(`/api/admin/areas/${area._id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Area deleted successfully')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete area')
      }
    } catch (error) {
      console.error('Error deleting area:', error)
      toast.error('Failed to delete area')
    }
  }

  const resetCountyForm = () => {
    setCountyForm({
      name: '',
      code: '',
      defaultShippingFee: '',
      estimatedDeliveryDays: '',
      isActive: true
    })
    setEditingCounty(null)
  }

  const resetAreaForm = () => {
    setAreaForm({
      name: '',
      countyId: '',
      shippingFee: '',
      estimatedDeliveryDays: '',
      isActive: true
    })
    setEditingArea(null)
  }

  const editCounty = (county: County) => {
    setEditingCounty(county)
    setCountyForm({
      name: county.name,
      code: county.code,
      defaultShippingFee: county.defaultShippingFee.toString(),
      estimatedDeliveryDays: county.estimatedDeliveryDays.toString(),
      isActive: county.isActive
    })
    setCountyDialogOpen(true)
  }

  const editArea = (area: Area) => {
    setEditingArea(area)
    
    // Extract the county ID string from potentially populated countyId
    const countyId = typeof area.countyId === 'object' && area.countyId?._id 
      ? area.countyId._id 
      : (area.countyId as string)
    
    setAreaForm({
      name: area.name,
      countyId: countyId,
      shippingFee: area.shippingFee.toString(),
      estimatedDeliveryDays: area.estimatedDeliveryDays.toString(),
      isActive: area.isActive
    })
    setAreaDialogOpen(true)
  }

  const filteredCounties = counties.filter(county =>
    county.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    county.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredAreas = areas.filter(area => {
    const matchesSearch = area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         area.countyName.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Handle populated countyId (object) vs direct countyId (string)
    const countyId = typeof area.countyId === 'object' && area.countyId?._id 
      ? area.countyId._id.toString() 
      : area.countyId?.toString()
    
    const matchesCounty = selectedCounty === 'all' || countyId === selectedCounty
    return matchesSearch && matchesCounty
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading shipping areas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Shipping Areas Management</h1>
          <p className="text-gray-600 mt-2">Manage counties and areas with their shipping fees</p>
        </div>
      </div>

      <Tabs defaultValue="counties" className="space-y-4">
        <TabsList>
          <TabsTrigger value="counties">Counties</TabsTrigger>
          <TabsTrigger value="areas">Areas</TabsTrigger>
        </TabsList>

        <TabsContent value="counties" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Counties ({filteredCounties.length})</h2>
              <p className="text-sm text-gray-600 mt-1">Manage shipping counties and their default rates</p>
            </div>
            <div className="flex items-center gap-4">
              <Input
                placeholder="Search counties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Dialog open={countyDialogOpen} onOpenChange={setCountyDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetCountyForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add County
                  </Button>
                </DialogTrigger>
                <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCounty ? 'Edit County' : 'Add New County'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCounty ? 'Update county information' : 'Create a new county with shipping details'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCountySubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="county-name">County Name</Label>
                      <Input
                        id="county-name"
                        value={countyForm.name}
                        onChange={(e) => setCountyForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Nairobi"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="county-code">County Code</Label>
                      <Input
                        id="county-code"
                        value={countyForm.code}
                        onChange={(e) => setCountyForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                        placeholder="e.g., NRB"
                        maxLength={5}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="county-fee">Default Shipping Fee (KES)</Label>
                      <Input
                        id="county-fee"
                        type="number"
                        min="0"
                        value={countyForm.defaultShippingFee}
                        onChange={(e) => setCountyForm(prev => ({ ...prev, defaultShippingFee: e.target.value }))}
                        placeholder="200"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="county-days">Estimated Delivery Days</Label>
                      <Input
                        id="county-days"
                        type="number"
                        min="1"
                        max="30"
                        value={countyForm.estimatedDeliveryDays}
                        onChange={(e) => setCountyForm(prev => ({ ...prev, estimatedDeliveryDays: e.target.value }))}
                        placeholder="3"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="county-active"
                      checked={countyForm.isActive}
                      onCheckedChange={(checked) => setCountyForm(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label htmlFor="county-active">Active</Label>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setCountyDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingCounty ? 'Update County' : 'Create County'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>County Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Default Shipping Fee</TableHead>
                  <TableHead>Delivery Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {counties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No counties found. Create your first county to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCounties.map((county) => (
                    <TableRow key={county._id}>
                      <TableCell className="font-medium">{county.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{county.code}</Badge>
                      </TableCell>
                      <TableCell>KES {county.defaultShippingFee.toLocaleString()}</TableCell>
                      <TableCell>{county.estimatedDeliveryDays} days</TableCell>
                      <TableCell>
                        <Badge variant={county.isActive ? "default" : "secondary"}>
                          {county.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editCounty(county)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteCounty(county)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="areas" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold">Areas ({filteredAreas.length})</h2>
                <p className="text-sm text-gray-600 mt-1">Manage specific areas within counties</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search areas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48"
                />
                <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by county" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Counties</SelectItem>
                    {counties.map((county) => (
                      <SelectItem key={county._id} value={county._id}>
                        {county.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Dialog open={areaDialogOpen} onOpenChange={setAreaDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetAreaForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Area
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingArea ? 'Edit Area' : 'Add New Area'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingArea ? 'Update area information' : 'Create a new area with shipping details'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAreaSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="area-name">Area Name</Label>
                      <Input
                        id="area-name"
                        value={areaForm.name}
                        onChange={(e) => setAreaForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Westlands"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="area-county">County</Label>
                      <Select
                        value={areaForm.countyId}
                        onValueChange={(value) => setAreaForm(prev => ({ ...prev, countyId: value }))}
                        required
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
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="area-fee">Shipping Fee (KES)</Label>
                      <Input
                        id="area-fee"
                        type="number"
                        min="0"
                        value={areaForm.shippingFee}
                        onChange={(e) => setAreaForm(prev => ({ ...prev, shippingFee: e.target.value }))}
                        placeholder="200"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="area-days">Estimated Delivery Days</Label>
                      <Input
                        id="area-days"
                        type="number"
                        min="1"
                        max="30"
                        value={areaForm.estimatedDeliveryDays}
                        onChange={(e) => setAreaForm(prev => ({ ...prev, estimatedDeliveryDays: e.target.value }))}
                        placeholder="2"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="area-active"
                      checked={areaForm.isActive}
                      onCheckedChange={(checked) => setAreaForm(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label htmlFor="area-active">Active</Label>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setAreaDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingArea ? 'Update Area' : 'Create Area'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Area Name</TableHead>
                  <TableHead>County</TableHead>
                  <TableHead>Shipping Fee</TableHead>
                  <TableHead>Delivery Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAreas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      {selectedCounty && selectedCounty !== 'all' 
                        ? 'No areas found for the selected county.' 
                        : 'No areas found. Create your first area to get started.'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAreas.map((area) => (
                    <TableRow key={area._id}>
                      <TableCell className="font-medium">{area.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{area.countyName}</Badge>
                      </TableCell>
                      <TableCell>KES {area.shippingFee.toLocaleString()}</TableCell>
                      <TableCell>{area.estimatedDeliveryDays} days</TableCell>
                      <TableCell>
                        <Badge variant={area.isActive ? "default" : "secondary"}>
                          {area.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editArea(area)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteArea(area)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}