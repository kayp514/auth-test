'use server'
import { cookies, headers } from "next/headers"
import type { UserInfo } from "./edge-session"


export interface AuthResult {
  user: UserInfo | null
  token: string | null
  error: Error | null
}


  /**
   * Get the current authenticated user from the session or token
   */
  export async function auth(): Promise<AuthResult> {
    try {
      const headersList = await headers()
      const cookieStore = await cookies()

      const userId = headersList.get('x-user-id')
      const authTime = headersList.get('x-auth-time')
      const emailVerified = headersList.get('x-auth-verified') === 'true'

      if (userId) {
        const token = cookieStore.get("_session_cookie")?.value || 
                     cookieStore.get("_session_token")?.value || 
                     null
  
        return {
          user: {
            uid: userId,
            email: headersList.get('x-user-email') || null,
            emailVerified,
            authTime: authTime ? parseInt(authTime) : undefined
          },
          token,
          error: null
        }
      }

      return {
        user: null,
        token: null,
        error: new Error("No valid session or token found"),
      }
    } catch (error) {
      console.error("Error in getAuthResult:", error)
      return {
        user: null,
        token: null,
        error: error instanceof Error ? error : new Error("An unknown error occurred"),
      }
    }
}

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
export async function getUserInfo(): Promise<UserInfo | null> {
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


