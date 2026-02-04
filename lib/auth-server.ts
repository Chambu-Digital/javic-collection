import { cookies } from 'next/headers'

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  console.log('Setting auth cookie...')
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  })
  console.log('Auth cookie set successfully')
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get('auth-token')?.value
}