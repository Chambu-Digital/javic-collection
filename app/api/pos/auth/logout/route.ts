import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const POS_COOKIE = 'pos-token'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete(POS_COOKIE)
  return NextResponse.json({ message: 'Logged out' })
}
