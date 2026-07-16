import { NextRequest, NextResponse } from 'next/server'

// Hosts that are considered "localhost" for dev purposes
const isLocalhost = (host: string) =>
  host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.startsWith('::1')

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const { pathname } = request.nextUrl

  const onPosSubdomain = host.startsWith('pos.')
  const onLocalhost    = isLocalhost(host)

  // ─────────────────────────────────────────────────────────────────────────
  // POS SUBDOMAIN (pos.javic.co.ke)
  // Rewrite every request transparently to /pos/* so the Next.js app can
  // serve the POS pages that live under app/pos/
  // ─────────────────────────────────────────────────────────────────────────
  if (onPosSubdomain) {
    // Already has the /pos prefix (e.g. after a client-side navigation) — pass through
    if (pathname.startsWith('/pos') || pathname.startsWith('/pos-login')) {
      return NextResponse.next()
    }
    // Always allow Next.js internals and static assets
    if (pathname.startsWith('/_next') || pathname === '/manifest.json' || pathname === '/sw.js') {
      return NextResponse.next()
    }
    // Rewrite root → /pos, everything else → /pos{pathname}
    const url = request.nextUrl.clone()
    url.pathname = pathname === '/' ? '/pos' : `/pos${pathname}`
    return NextResponse.rewrite(url)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BLOCK /pos ON MAIN DOMAIN IN PRODUCTION
  // If someone visits javic.co.ke/pos (or /pos/*) they get a 404.
  // On localhost /pos stays accessible for local development.
  // ─────────────────────────────────────────────────────────────────────────
  if (!onLocalhost && (pathname.startsWith('/pos') || pathname === '/pos-login')) {
    // Return Next.js 404 by rewriting to the built-in not-found path
    const url = request.nextUrl.clone()
    url.pathname = '/not-found'
    return NextResponse.rewrite(url, { status: 404 })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POS AUTH GUARD
  // Runs on localhost (dev) and on the POS subdomain (already handled above).
  // Protects /pos/* and /pos-login lives outside this guard so it's always reachable.
  // ─────────────────────────────────────────────────────────────────────────
  const isPosLoginPath   = pathname === '/pos-login'
  const isPosApiAuthPath = pathname.startsWith('/api/pos/auth')
  const isPosApiPath     = pathname.startsWith('/api/pos')
  const isNextInternal   = pathname.startsWith('/_next')
  const isStaticAsset    = pathname === '/manifest.json' || pathname === '/sw.js'

  // Always allow through: login, auth APIs, Next.js internals, static assets
  if (isPosLoginPath || isPosApiAuthPath || isNextInternal || isStaticAsset) {
    return NextResponse.next()
  }

  // POS API routes (non-auth) self-authenticate inside the handler
  if (isPosApiPath) {
    return NextResponse.next()
  }

  // Require pos-token cookie for all other /pos pages
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
