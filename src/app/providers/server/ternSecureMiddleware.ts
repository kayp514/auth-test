import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers'

export const runtime = "edge"


interface UserInfo {
  uid: string
  email: string | null
  disabled?: boolean
}

interface RedirectState {
  requestedPath: string
  timestamp: number
}


/**
 * Edge-compatible token verification using Firebase Auth REST API
 */
async function verifyTokenEdge(idToken: string): Promise<UserInfo | null> {
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      }
    )

    const data = await response.json()

    
    if (!response.ok || !data.users?.[0]) {
      return null
    }

    const user = data.users[0]
    return {
      uid: user.localId,
      email: user.email || null,
      disabled: user.disabled || false
    }
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}


/**
 * Edge-compatible session cookie verification
 */
async function verifySessionEdge(sessionCookie: string): Promise<UserInfo | null> {
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionCookie}`
        }
      }
    )

    const data = await response.json()

    if (!response.ok || !data.users?.[0]) {
      return null
    }

    const user = data.users[0]
    return {
      uid: user.localId,
      email: user.email || null,
      disabled: user.disabled || false
    }
  } catch (error) {
    console.error('Session verification error:', error)
    return null
  }
}


/**
 * Check if a path matches a pattern, supporting wildcards
 */
function matchPath(pathname: string, pattern: string): boolean {
  if (pattern === pathname) return true
  
  // Wildcard match
  if (pattern.endsWith('*')) {
    const basePattern = pattern.slice(0, -1)
    return pathname.startsWith(basePattern)
  }
  return false
}


/**
 * Edge-compatible auth check
 */
async function edgeAuth(request: NextRequest) {
  const cookieStore = await cookies()

  try {
    // First try session cookie
    const sessionCookie = cookieStore.get("_session_cookie")?.value
    if (sessionCookie) {
      const userInfo = await verifySessionEdge(sessionCookie)
      if (userInfo && !userInfo.disabled) {
        return { user: userInfo, token: sessionCookie, error: null }
      }
    }

    // Then try ID token
    const idToken = cookieStore.get("_session_token")?.value
    if (idToken) {
      const userInfo = await verifyTokenEdge(idToken)
      if (userInfo && !userInfo.disabled) {
        return { user: userInfo, token: idToken, error: null }
      }
    }

    return {
      user: null,
      token: null,
      error: new Error("No valid session or token found")
    }
  } catch (error) {
    return {
      user: null,
      token: null,
      error: error instanceof Error ? error : new Error("Auth error")
    }
  }
}

/**
 * Middleware factory that handles authentication and custom logic
 * @param customHandler Optional function for additional custom logic
 */

export function ternSecureMiddleware(
  customHandler: (request: NextRequest) => Promise<void>
) {
  return async function middleware(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl
    const publicPaths = ['/sign-in', '/sign-up', '/api/auth/*']

    // Check if path is public
    const isPublicPath = publicPaths.some(path => matchPath(pathname, path))

    if (pathname === '/sign-in') {
      const response = NextResponse.next()
      
      // Get redirect path from query params
      const redirectTo = searchParams.get('redirect')
      if (redirectTo) {
        // Store the requested path in a cookie for post-login redirect
        const redirectState: RedirectState = {
          requestedPath: redirectTo,
          timestamp: Date.now()
        }
        
        response.cookies.set('redirectState', JSON.stringify(redirectState), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 300 // 5 minutes expiry
        })
      }
      return response
    }

    if (isPublicPath) {
      return NextResponse.next()
    }

    try {
      const { user, token, error } = await edgeAuth(request)
      console.log(user)
      if(error || !user || !token) {

        const redirectUrl = new URL('/sign-in', request.url)
        redirectUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(redirectUrl)
      }

      // Run custom handler if provided
      if (customHandler) {
        await customHandler(request)
      }

      const response = NextResponse.next()
      response.headers.set('X-User-ID', user.uid ?? '')

      return response

    } catch (error) {
      console.error('Error in ternSecureMiddleware:', error)

      const redirectUrl = new URL('/sign-in', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }
}

