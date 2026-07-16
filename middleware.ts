import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const { pathname } = request.nextUrl

  // -----------------------------------------------------------------------
  // Subdomain routing — production only
  // pos.javic.co.ke  →  rewrite every request to /pos/*
  // On localhost use /pos directly; this block only activates when the host
  // starts with "pos." and is not localhost.
  // -----------------------------------------------------------------------
  const isPosSubdomain =
    host.startsWith('pos.') && !host.startsWith('localhost')

  if (isPosSubdomain) {
    if (pathname.startsWith('/pos')) {
      return NextResponse.next()
    }
    const rewritePath = pathname === '/' ? '/pos' : `/pos${pathname}`
    const url = request.nextUrl.clone()
    url.pathname = rewritePath
    return NextResponse.rewrite(url)
  }

  // -----------------------------------------------------------------------
  // POS auth guard (applies on both localhost and production)
  //
  // Every /pos route except /pos/login and POS API routes requires a valid
  // pos-token cookie.  The cookie is issued by /api/pos/auth/login and is
  // completely separate from the main site's auth-token cookie.
  // -----------------------------------------------------------------------

  // Routes that are always public within the /pos namespace
  const isPosLoginPath   = pathname === '/pos-login'
  const isPosApiAuthPath = pathname.startsWith('/api/pos/auth')
  const isPosApiPath     = pathname.startsWith('/api/pos')
  const isNextInternal   = pathname.startsWith('/_next')
  const isStaticAsset    = pathname === '/manifest.json' || pathname === '/sw.js'

  if (isPosLoginPath || isPosApiAuthPath || isNextInternal || isStaticAsset) {
    return NextResponse.next()
  }

  // POS API routes (non-auth) validate their own token inside the handler,
  // but we still let them pass through here so the handler can return a
  // proper 401 rather than a redirect.
  if (isPosApiPath) {
    return NextResponse.next()
  }

  // For POS UI pages, enforce the pos-token cookie
  if (pathname.startsWith('/pos')) {
    const posToken = request.cookies.get('pos-token')?.value

    if (!posToken) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/pos-login'
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
