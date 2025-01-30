"use client"

import { createContext, useContext } from 'react'
import { ternSecureAuth } from '../utils/client-init';
import { User } from 'firebase/auth';
import type { TernSecureState, SignInResponse } from '../utils/types';

export const TernSecureUser = (): User | null => {
  return ternSecureAuth.currentUser;
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

