'use server'
import { cookies } from "next/headers"
import {
  verifyTernSessionCookie,
  verifyTernIdToken,
  verifyUser,
  type User,
} from "./sessionTernSecure"
import { adminTernSecureAuth } from "../utils/admin-init"


export interface AuthUser extends User {
  token: string | null
}

export interface AuthResult {
  user: AuthUser | null
  token: string | null
  error: Error | null
}


  /**
   * Get the current authenticated user from the session or token
   */
  export async function auth(): Promise<AuthResult> {
    try {
      const cookieStore = await cookies()

      // First try session cookie
      const sessionCookie = cookieStore.get("_session_cookie")?.value
      if (sessionCookie) {
        const sessionResult = await verifyTernSessionCookie(sessionCookie)
        if (sessionResult.valid && sessionResult.uid) {
          const userDetails = await adminTernSecureAuth.getUser(sessionResult.uid)
          return {
            user: {
              uid: userDetails.uid,
              email: userDetails.email || null,
              token: null,
            },
            token: sessionCookie,
            error: null,
          }
        }
      }

      // Then try ID token
      const idToken = cookieStore.get("_session_token")?.value
      if (idToken) {
        const tokenResult = await verifyTernIdToken(idToken)
        if (tokenResult.valid && tokenResult.uid) {
          const userDetails = await adminTernSecureAuth.getUser(tokenResult.uid)
          return {
            user: {
              uid: userDetails.uid,
              email: userDetails.email || null,
              token: null,
            },
            token: idToken,
            error: null,
          }
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


