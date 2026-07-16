'use client'

import { useState } from 'react'
import { Save, Store, Printer, Users, Shield, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function PosSettingsPage() {
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
    }, 1000)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">POS Settings</h1>
        <p className="text-gray-600">Configure outlet, permissions, and system preferences</p>
      </div>

      <Tabs defaultValue="outlet">
        <TabsList>
          <TabsTrigger value="outlet">Outlet</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="printing">Printing</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="outlet" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Outlet Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="outletName">Outlet Name</Label>
                <Input id="outletName" defaultValue="Main Store - Nairobi" />
              </div>
              <div>
                <Label htmlFor="outletCode">Outlet Code</Label>
                <Input id="outletCode" defaultValue="OUT-001" />
              </div>
              <div>
                <Label htmlFor="outletLocation">Location</Label>
                <Input id="outletLocation" defaultValue="Nairobi CBD" />
              </div>
              <div>
                <Label htmlFor="outletPhone">Contact Phone</Label>
                <Input id="outletPhone" defaultValue="+254 712 345 678" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="isActive" defaultChecked />
                <Label htmlFor="isActive">Outlet is Active</Label>
              </div>
              <Button onClick={handleSave} disabled={saving} className="mt-4">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Role Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Cashier</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Make sales</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Apply discounts (up to 10%)</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">View customers</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Hold orders</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Supervisor</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">All cashier permissions</span>
                    <Switch defaultChecked disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Apply discounts (up to 25%)</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Override prices</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Process returns</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">View own reports</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Manager</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">All supervisor permissions</span>
                    <Switch defaultChecked disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Apply unlimited discounts</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Enable customer credit</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Change credit limits</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">View all reports</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Resolve sync conflicts</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="printing" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="w-5 h-5" />
                Receipt Printing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="printerName">Default Printer</Label>
                <Input id="printerName" placeholder="Select printer..." />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="autoPrint" defaultChecked />
                <Label htmlFor="autoPrint">Auto-print receipts after sale</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="printLogo" defaultChecked />
                <Label htmlFor="printLogo">Include company logo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="printBarcode" defaultChecked />
                <Label htmlFor="printBarcode">Include barcode</Label>
              </div>
              <div>
                <Label htmlFor="receiptFooter">Receipt Footer Text</Label>
                <Input id="receiptFooter" defaultValue="Thank you for shopping with Javic Collection!" />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="lowStock" defaultChecked />
                <Label htmlFor="lowStock">Low stock alerts</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="syncErrors" defaultChecked />
                <Label htmlFor="syncErrors">Sync error notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="creditOverdue" defaultChecked />
                <Label htmlFor="creditOverdue">Credit overdue reminders</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="newOrders" defaultChecked />
                <Label htmlFor="newOrders">New online order alerts</Label>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
