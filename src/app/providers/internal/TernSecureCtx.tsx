"use client"

import { createContext, useContext } from 'react'
import { ternSecureAuth } from '../utils/client-init';
import { User } from 'firebase/auth';

export const TernSecureUser = (): User | null => {
  return ternSecureAuth.currentUser;
}

export interface TernSecureState {
  user: User | null
  userId: string | null
  isLoaded: boolean
  error: Error | null
  isValid: boolean
  token: any | null
}

export interface TernSecureCtxValue extends TernSecureState {
  //checkTokenValidity: () => Promise<void>;
  signOut: (error?: Error) => Promise<void>;
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

