import { cache } from "react"
import { headers } from "next/headers";
import type { User as BaseUser } from "./types"
import { initializeConfig } from "../utils/config";
import { TernServerAuth, type AuthenticatedApp, type TernServerAuthOptions } from "./TernAuthClass"


export interface AuthResult {
  user: BaseUser | null
  error: Error | null
}

export async function TernSecureServer(opts: TernServerAuthOptions): Promise<TernServerAuth> {
    const serverAuth = TernServerAuth.initialize(opts);
    return serverAuth;
}

export async function getAuthenticatedApp(): Promise<AuthenticatedApp> {
  try {
    const serverAuth = await TernSecureServer({
      firebaseConfig: { ...initializeConfig() }
    });
    const headersList = await headers();
    return serverAuth.getAuthenticatedAppFromHeaders(headersList);
  } catch (error) {
    console.error('Failed to get authenticated app:', error);
    throw error;
  }
}

  /**
   * Get the current authenticated user from the session or token
   */
export const auth = cache(async (): Promise<AuthResult> => {
  try {
    const { currentUser } = await getAuthenticatedApp();
    console.log('Current user in auth:', currentUser);
    
    if (currentUser) {
      return {
        user: {
          uid: currentUser.uid,
          email: currentUser.email || null,
          tenantId: currentUser.tenantId || 'default',
          authTime: currentUser.authTime
        },
        error: null
      };
    }
    
    return {
      user: null,
      error: null // No error, just no user
    };
  } catch (error) {
    console.error('Auth error:', error);
    return {
      user: null,
      error: error as Error
    };
  }
});

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