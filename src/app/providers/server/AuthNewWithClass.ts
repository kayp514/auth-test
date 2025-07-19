import 'server-only'

import { cache } from "react"
import { headers } from "next/headers";
import type { User as BaseUser } from "./types"
import type { TernSecureUser, TernSecureConfig} from '@/app/providers/utils/types';
import { initializeConfig, loadFireConfig } from "../utils/config";
import { firebaseConfig} from "../utils/fireconfig";
import { TernServerAuth, type TernServerAuthOptions } from "./TernAuthClass"
import { FirebaseServerAppSettings, initializeServerApp } from "firebase/app";
import { getAuth } from "firebase/auth";

export interface AuthResult {
  user: BaseUser | null
  error: Error | null
}

export interface AuthenticatedApp {
  currentUser?: TernSecureUser | null;
}

export async function TernSecureServer(opts: TernServerAuthOptions): Promise<TernServerAuth> {
    const serverAuth = TernServerAuth.initialize(opts);
    return serverAuth;
}

export async function getFirebaseServerApp(): Promise<AuthenticatedApp> {
  try {
    const headersList = await headers();
    const authIdToken = headersList.get('authorization')?.split(' ')[1];

    const serverApp = initializeServerApp(firebaseConfig, { authIdToken });
    const auth = getAuth(serverApp);
    await auth.authStateReady();
    if (!auth.currentUser) {
      console.warn('No authenticated user found');
      return { currentUser: null };
    }
    return {
      currentUser: auth.currentUser
    }
    //return serverAuth.getAuthenticatedAppFromHeaders(authIdToken);
  } catch (error) {
    console.error('Failed to get authenticated app:', error);
    throw error;
  }
}

export async function getAuthenticatedApp(): Promise<AuthenticatedApp> {
  try {
    const headersList = await headers();
    
    const serverAuth = await TernSecureServer({
      firebaseConfig: { ...initializeConfig() }
    });
    
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