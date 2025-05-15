import { cache } from "react"
import { cookies } from "next/headers"
//import type { User } from "./types"
import { BaseUser } from "@/app/providers/utils/types"
import { verifyFirebaseToken } from "./jwt"
import { TernSecureError } from "@/app/providers/utils/errors"



export interface AuthResult {
  user: BaseUser| null
  error: Error | null
}

  /**
   * Get the current authenticated user from the session or token
   */
export const auth = cache(async (): Promise<AuthResult> => {
  try {
    // Get all active sessions for debugging
   console.log("auth: Starting auth check...")
   const cookieStore = await cookies()

    // First try session cookie as it's more secure
    const sessionCookie = cookieStore.get("_session_cookie")?.value
    if (sessionCookie) {
      const result = await verifyFirebaseToken(sessionCookie, true)
      if (result.valid) {
        const user: BaseUser = {
          uid: result.uid ?? '',
          email: result.email || null,
          tenantId: result.tenant || 'default',
          authTime: result.authTime
        }
        console.log('auth:', user.uid)
        return { user, error: null }
      }
    }

    

    // Fallback to ID token
    const idToken = cookieStore.get("_session_token")?.value
    if (idToken) {
      const result = await verifyFirebaseToken(idToken, false)
      if (result.valid) {
        const user: BaseUser = {
          uid: result.uid ?? '',
          email: result.email || null,
          tenantId: result.tenant || 'default',
          authTime: result.authTime
        }
        return { user, error: null }
      }
    }

      return {
          user: null,
          error: new TernSecureError('UNAUTHENTICATED', 'No valid session found')
      }

    } catch (error) {
      console.error("Error in Auth:", error)
      if (error instanceof TernSecureError) {
        return {
          user: null,
          error
        }
      }
      return {
        user: null,
        error: new TernSecureError('INTERNAL_ERROR', 'An unexpected error occurred')
      }
    }
  })

/**
 * Type guard to check if user is authenticated
 */
export const isAuthenticated = cache(async (): Promise<boolean>  => {
  const { user } = await auth()
  return user !== null
})

/**
 * Get user info from auth result
 */
export const getUser = cache(async (): Promise<BaseUser | null> => {
  const { user } = await auth()
  return user
})

/**
 * Require authentication
 * Throws error if not authenticated
 */
export const requireAuth = cache(async (): Promise<BaseUser> => {
  const { user, error } = await auth()

  if (!user) {
    throw error || new Error("Authentication required")
  }

  return user
})