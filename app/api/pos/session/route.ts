import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Outlet from '@/models/Outlet'
import PosSettings from '@/models/PosSettings'
import User from '@/models/User'
import { requirePosAuth, handlePosAuthError } from '@/lib/pos/auth'
import { POS_PERMISSIONS } from '@/lib/pos/permissions'

export async function GET(request: NextRequest) {
  try {
    const { user, checker } = await requirePosAuth(request)
    await connectDB()

    // Use the single Outlet model — the same one the settings page manages
    let outlets = await Outlet.find({ isActive: true }).lean()
    if (!outlets.length) {
      // Auto-create a default outlet so the POS is always operable
      const defaultOutlet = await Outlet.create({
        outletId: 'MAIN',
        name:     'Main Shop',
        location: 'Biashara Street, Marikiti — Mombasa',
        phone:    '+254 706 512 984',
        isActive: true,
      })
      outlets = [defaultOutlet.toObject()]
    }

    const settings = await PosSettings.findOne().lean()
    const dbUser = await User.findById(user.id).select('posRole posOutletId firstName lastName').lean()

    const defaultOutlet =
      outlets.find(o => o._id?.toString() === (dbUser as any)?.posOutletId?.toString()) ||
      outlets[0]

    return NextResponse.json({
      outlets,
      defaultOutlet,
      settings: settings || {
        offlineSellingEnabled: true,
        offlineCreditEnabled: false,
        lowStockThreshold: 5,
      },
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        role: checker.getPosRole(),
        roleLabel: checker.getPosRoleLabel(),
        posPermissions: Object.values(POS_PERMISSIONS).filter(p => checker.hasPosPermission(p as any)),
      },
    })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    return NextResponse.json({ error: 'Failed to load POS session' }, { status: 500 })
  }
}
