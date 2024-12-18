"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { ternSecureAuth } from '../utils/client-init'
import { onAuthStateChanged, User } from "firebase/auth"
import { TernSecureCtx, TernSecureCtxValue, TernSecureState } from './TernSecureCtx'
import { useRouter } from 'next/navigation'

interface TernSecureClientProviderProps {
  children: React.ReactNode;
  onUserChanged?: (user: User | null) => Promise<void>;
  loginPath?: string;
  loadingComponent?: React.ReactNode;
}

export function TernSecureClientProvider({ 
  children, 
  loginPath = '/sign-in',
  loadingComponent
}: TernSecureClientProviderProps) {
  const auth = useMemo(() => ternSecureAuth, []);
  const router = useRouter();
  const [authState, setAuthState] = useState<TernSecureState>(() => ({
    userId: null,
    isLoaded: false,
    error: null,
    isValid: false,
  }));

  const handleSignOut = useCallback(async (error?: Error) => {
    await auth.signOut();
    setAuthState({
      isLoaded: true,
      userId: null,
      error: error || null,
      isValid: false,
    });
    router.push(loginPath);
  }, [auth, router, loginPath]);

useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        setAuthState({
          isLoaded: true,
          userId: user.uid,
          isValid: true,
          error: null
        })
      } else {
        setAuthState({
          isLoaded: true,
          userId: null,
          isValid: false,
          error: new Error('User is not authenticated')
        })
        router.push(loginPath);
      }
    }, (error) => {
      handleSignOut(error instanceof Error ? error : new Error('Authentication error occurred'));
    })
    
    return () => unsubscribe()
  }, [auth, handleSignOut, router, loginPath])

  const contextValue: TernSecureCtxValue = useMemo(() => ({
    ...authState,
    signOut: handleSignOut,
  }), [authState, handleSignOut]);

  if (!authState.isLoaded) {
    return (
      <TernSecureCtx.Provider value={contextValue}>
        {loadingComponent || (
          <div aria-live="polite" aria-busy="true">
            <span className="sr-only">Loading authentication state...</span>
          </div>
        )}
      </TernSecureCtx.Provider>
    );
  }

  return (
      <TernSecureCtx.Provider value={contextValue}>
       {children}
      </TernSecureCtx.Provider>
  )
}