import { NextResponse, type NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

const PUBLIC_PATHS = new Set(['/', '/signin', '/signup'])
const AUTH_API_PREFIX = '/api/auth'

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // Pass through Better Auth API routes, static assets, internals
  if (
    pathname.startsWith(AUTH_API_PREFIX) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  // Optimistic session check via cookie (no DB round-trip)
  const sessionCookie = getSessionCookie(request)

  if (!sessionCookie) {
    const signInUrl = new URL('/signin', request.url)
    signInUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
