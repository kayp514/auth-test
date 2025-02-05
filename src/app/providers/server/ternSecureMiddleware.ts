import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers'

export const runtime = "edge"


interface UserInfo {
  uid: string
  email: string | null
  disabled?: boolean
}

interface Auth {
  user: UserInfo | null
  token: string | null
  protect: () => Promise<void>
}

type MiddlewareCallback = (
  auth: Auth,
  request: NextRequest
) => Promise<void>


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
    console.log('data Token', data)

    
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
    console.log('data Session', data)

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
 * Create a route matcher function for public paths
 */
export function createRouteMatcher(patterns: string[]) {
  return (request: NextRequest): boolean => {
    const { pathname } = request.nextUrl
    return patterns.some(pattern => {
      // Convert route pattern to regex
      const regexPattern = new RegExp(
        `^${pattern.replace(/\*/g, '.*').replace(/\((.*)\)/, '(?:$1)?')}$`
      )
      return regexPattern.test(pathname)
    })
  }
}


/**
 * Edge-compatible auth check
 */
async function edgeAuth(request: NextRequest): Promise<Auth>{
  const cookieStore = await cookies()

  async function protect() {
    const { pathname } = request.nextUrl
    throw new Error('Unauthorized access')
  }

  try {
    // First try session cookie
    const sessionCookie = cookieStore.get("_session_cookie")?.value
    if (sessionCookie) {
      const userInfo = await verifySessionEdge(sessionCookie)
      if (userInfo && !userInfo.disabled) {
        return { 
          user: userInfo,
          token: sessionCookie,
          protect: async () => {}
        }
      }
    }

    // Then try ID token
    const idToken = cookieStore.get("_session_token")?.value
    if (idToken) {
      const userInfo = await verifyTokenEdge(idToken)
      if (userInfo && !userInfo.disabled) {
        return { 
          user: userInfo,
          token: idToken,
          protect: async () => {}
        }
      }
    }

    return {
      user: null,
      token: null,
      protect
    }
  } catch (error) {
    return {
      user: null,
      token: null,
      protect
    }
  }
}

/**
 * Middleware factory that handles authentication and custom logic
 * @param customHandler Optional function for additional custom logic
 */

export function ternSecureMiddleware(callback: MiddlewareCallback) {
  return async function middleware(request: NextRequest) {
    try {
      const auth = await edgeAuth(request)

      try {

        await callback(auth, request)

        // If we get here, either the route was public or auth succeeded
        const response = NextResponse.next()
        if (auth.user) {
          response.headers.set('x-user-id', auth.user.uid)
        }
        return response

      } catch (error) {
        // Handle unauthorized access
        if (error instanceof Error && error.message === 'Unauthorized access') {
          const redirectUrl = new URL('/sign-in', request.url)
          redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
          return NextResponse.redirect(redirectUrl)
        }
        throw error
      }

    } catch (error) {
      console.error('Error in ternSecureMiddleware:', error)
      const redirectUrl = new URL('/sign-in', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }
}
