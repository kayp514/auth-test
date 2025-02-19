"use client"

import { createContext, useContext } from 'react'
import { ternSecureAuth } from '../utils/client-init';
import type { TernSecureState, SignInResponse } from '@/app/providers/utils/types';
import type { CurrentUser} from '@/app/providers/utils/types';

export const getCurrentUser = (): CurrentUser | null => {
  const user = ternSecureAuth.currentUser;

  if (!user) return null

  return {
    // TernSecureUser fields (UserInfo)
    displayName: user.displayName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    photoURL: user.photoURL,
    providerId: user.providerId,
    uid: user.uid,
    
    // Additional CurrentUser fields (User)
    emailVerified: user.emailVerified,
    isAnonymous: user.isAnonymous,
    metadata: {
      creationTime: user.metadata.creationTime,
      lastSignInTime: user.metadata.lastSignInTime,
    },
    providerData: user.providerData,
    refreshToken: user.refreshToken,
    tenantId: user.tenantId,
    
    // BaseUser fields for consistency
    authTime: user.metadata.lastSignInTime 
      ? new Date(user.metadata.lastSignInTime).getTime()
      : undefined
  }
}

export interface TernSecureCtxValue extends TernSecureState {
 signOut: () => Promise<void>
 setEmail: (email: string) => void
 getAuthError: () => SignInResponse
 redirectToLogin: () => void
}

export const TernSecureCtx = createContext<TernSecureCtxValue | null>(null)

TernSecureCtx.displayName = 'TernSecureCtx'

export const useTernSecure = (hookName: string) => {
  const context = useContext(TernSecureCtx)
  
  if (!context) {
    throw new Error(
      `${hookName} must be used within TernSecureProvider`
    )
  }

  return context
}

