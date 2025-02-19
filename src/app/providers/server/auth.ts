import { cache } from "react"
import { cookies } from "next/headers"
import type { User } from "./types"
import { verifyFirebaseToken } from "./jwt"

export interface AuthResult {
  user: User | null
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
          const user: User = {
            uid: result.uid ?? '',
            email: result.email || null,
            authTime: result.authTime
          }
          return { user, error: null }
        }
      }
  
      // Fallback to ID token
      const idToken = cookieStore.get("_session_token")?.value
      if (idToken) {
        const result = await verifyFirebaseToken(idToken, false)
        if (result.valid) {
          const user: User = {
            uid: result.uid ?? '',
            email: result.email || null,
            authTime: result.authTime
          }
          return { user, error: null }
        }
      }
  
        return {
            user: null,
            error: new Error('UNAUTHENTICATED')
        }
  
      } catch (error) {
        console.error("Error in Auth:", error)
        if (error instanceof Error) {
          return {
            user: null,
            error
          }
        }
        return {
          user: null,
          error: new Error('INTERNAL_ERROR')
        }
      }
    })
  

/**
 * Type guard to check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const authResult = await auth()
  return authResult.user !== null
}

/**
 * Get user info from auth result
 */
export async function getUserInfo(): Promise<User | null> {
  const authResult = await auth()
  if (!authResult.user) {
    return null
  }

  return {
    uid: authResult.user.uid,
    email: authResult.user.email,
    emailVerified: authResult.user.emailVerified,
    authTime: authResult.user.authTime
  }
  }


