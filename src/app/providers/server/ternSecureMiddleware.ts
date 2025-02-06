import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers'
import { verifySession, verifySessionEdge, verifyTokenEdge, type UserInfo } from './edge-session'
import { verifyFirebaseToken } from './jwt';
import type { AuthResult, AuthUser } from './auth-new'

export const runtime = "edge"


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
      const userInfo = await verifyFirebaseToken(sessionCookie, true)
      console.log('userInfo', userInfo)
      if (userInfo.valid) {
        return { 
          user: {
            uid: userInfo.uid ?? '',
            email: userInfo.email ?? null,
          },
          token: sessionCookie,
          protect: async () => {}
        }
      }
    }

    // Then try ID token
    const idToken = cookieStore.get("_session_token")?.value
    if (idToken) {
      const userInfo = await verifyFirebaseToken(idToken, false)
      if (userInfo.valid) {
        return { 
          user: {
            uid: userInfo.uid ?? '',
            email: userInfo.email ?? null,
          },
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
 * Edge-compatible auth check
 */
async function edgeAuthSecond(request: NextRequest): Promise<Auth> {
  async function protect() {
    throw new Error("Unauthorized access")
  }

  try {
    const sessionResult = await verifySession(request)

    if (sessionResult.isAuthenticated && sessionResult.user) {
      return {
        user: sessionResult.user,
        token: request.cookies.get("_session_cookie")?.value || request.cookies.get("_session_token")?.value || null,
        protect: async () => {},
      }
    }

    return {
      user: null,
      token: null,
      protect,
    }
  } catch (error) {
    console.error("Auth check error:", error)
    return {
      user: null,
      token: null,
      protect,
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
      const auth = await edgeAuthSecond(request)

      try {


        await callback(auth, request)

        const response = NextResponse.next()

        if (auth.user) {
          // Set auth headers
          response.headers.set("x-user-id", auth.user.uid)
          if (auth.user.email) {
            response.headers.set("x-user-email", auth.user.email)
          }
          if (auth.user.emailVerified !== undefined) {
            response.headers.set("x-email-verified", auth.user.emailVerified.toString())
          }
          if (auth.user.authTime) {
            response.headers.set("x-auth-time", auth.user.authTime.toString())
          }
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
      console.error("Middleware error:", {
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
        path: request.nextUrl.pathname,
      })

      const redirectUrl = new URL("/sign-in", request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }
}
