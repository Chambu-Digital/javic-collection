import { NextRequest, NextResponse } from 'next/server'

const isLocalhost = (host: string) =>
  host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.startsWith('::1')

export function middleware(request: NextRequest) {
  const host     = request.headers.get('host') || ''
  const { pathname } = request.nextUrl

  const onPosSubdomain = host.startsWith('pos.')
  const onLocalhost    = isLocalhost(host)

  // ─────────────────────────────────────────────────────────────────────────
  // POS SUBDOMAIN  (pos.javic.co.ke)
  //
  // UI pages   → rewrite /foo  to /pos/foo  (Next.js serves app/pos/...)
  // API routes → pass through unchanged  (/api/... already resolves correctly)
  // Statics    → pass through unchanged
  // ─────────────────────────────────────────────────────────────────────────
  if (onPosSubdomain) {
    // Never touch API routes — they resolve correctly without any prefix
    if (pathname.startsWith('/api/')) return NextResponse.next()

    // Never touch Next.js internals or known static files
    if (
      pathname.startsWith('/_next') ||
      pathname === '/manifest.json' ||
      pathname === '/sw.js'        ||
      pathname.startsWith('/icon') ||   // icon-192.png, icon-512.png, icon.svg
      pathname === '/favicon.ico'
    ) {
      return NextResponse.next()
    }

    // Already carries the /pos prefix (client-side nav after first load)
    if (pathname.startsWith('/pos') || pathname === '/pos-login') {
      return NextResponse.next()
    }

    // Rewrite UI paths: / → /pos   /make-sale → /pos/make-sale   etc.
    const url = request.nextUrl.clone()
    url.pathname = pathname === '/' ? '/pos' : `/pos${pathname}`
    return NextResponse.rewrite(url)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BLOCK /pos ON MAIN DOMAIN IN PRODUCTION
  // javic.co.ke/pos or /pos-login → 404
  // localhost keeps working for local dev
  // ─────────────────────────────────────────────────────────────────────────
  if (!onLocalhost && (pathname.startsWith('/pos') || pathname === '/pos-login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/not-found'
    return NextResponse.rewrite(url, { status: 404 })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POS AUTH GUARD  (localhost only — subdomain handled above)
  //
  // /pos-login, /api/pos/*, /_next, static assets → always pass through
  // /pos/*  without pos-token cookie → redirect to /pos-login
  // ─────────────────────────────────────────────────────────────────────────
  if (
    pathname === '/pos-login'              ||
    pathname.startsWith('/api/')           ||
    pathname.startsWith('/_next')          ||
    pathname === '/manifest.json'          ||
    pathname === '/sw.js'
  ) {
    return NextResponse.next()
  }

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
