import 'server-only'

import { cache } from "react"
import { headers } from "next/headers";
import type { TernSecureUser } from '@/app/providers/utils/types';
import { initializeServerConfig } from "../utils/config";
import { firebaseConfig} from "../utils/fireconfig";
import { TernServerAuth, type TernServerAuthOptions } from "./TernAuthClass"
import { initializeServerApp } from "firebase/app";
import { getAuth } from "firebase/auth";

export interface AuthResult {
  user: TernSecureUser | null
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
      return { currentUser: null };
    }
    return {
      currentUser: auth.currentUser
    }
  } catch (error) {
    console.error('Failed to get authenticated app:', error);
    throw error;
  }
}

export async function getAuthenticatedApp(): Promise<AuthenticatedApp> {
  try {
    const headersList = await headers();
    
    const serverAuth = await TernSecureServer({
      firebaseServerConfig: { ...initializeServerConfig() }
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
        user: currentUser,
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
export const getUser = cache(async (): Promise<TernSecureUser | null> => {
  const { user } = await auth()
  return user
})

/**
 * Require authentication
 * Throws error if not authenticated
 */
export const requireAuth = cache(async (): Promise<TernSecureUser> => {
  const { user, error } = await auth()

  if (!user) {
    throw error || new Error("Authentication required")
  }

  return user
})