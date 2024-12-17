"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { ternSecureAuth } from '../utils/client-init'
import { onAuthStateChanged, User, onIdTokenChanged} from "firebase/auth"
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
  onUserChanged,
  loginPath = '/sign-in',
  loadingComponent
}: TernSecureClientProviderProps) {
  const auth = useMemo(() => ternSecureAuth, []);
  const router = useRouter();

  const [authState, setAuthState] = useState<TernSecureState>(() => ({
    user: null,
    userId: null,
    isLoaded: false,
    error: null,
    isValid: false,
    token: null
  }));

  const handleSignOut = useCallback(async (error?: Error) => {
    await auth.signOut();
    setAuthState({
      isLoaded: true,
      user: null,
      userId: null,
      error: error || null,
      isValid: false,
      token: null
    });
    router.push(loginPath);
  }, [auth, loginPath, router]);

  const checkUserValidity = useCallback(async (user: User | null) => {
    if (user) {
      try {
        const userMetadata = user.metadata;

        if (!userMetadata) {
          console.log('User metadata not available');
          return { isValid: false, token: null };
        }

        if (!userMetadata.lastSignInTime || !userMetadata.creationTime) {
          console.log('Missing timestamp metadata');
          return { isValid: false, token: null };
        }

        const lastSignInTime = new Date(userMetadata.lastSignInTime).getTime();
        const creationTime = new Date(userMetadata.creationTime).getTime();

        if (lastSignInTime < creationTime) {
          console.log('User might be disabled - last sign-in time is older than creation time');
          return { isValid: false, token: null };
        }

        // Only get a new token if we don't have one
        let token = authState.token;
        if (!token) {
          token = await user.getIdToken(true);
        }

        return { isValid: true, token };
      } catch (error) {
        console.error("Error checking user validity:", error);
        return { isValid: false, token: null };
      }
    } 
    handleSignOut(new Error('User is not valid'));
    return { isValid: false, token: null };
  }, [authState.token, handleSignOut]);

  useEffect(() => {
    let unsubscribeAuthState: () => void;
    let unsubscribeIdToken: () => void;

    unsubscribeAuthState = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const { isValid, token } = await checkUserValidity(user);
        if (isValid) {
          setAuthState({
            isLoaded: true,
            user,
            userId: user.uid,
            isValid: true,
            token,
            error: null
          });
          onUserChanged && await onUserChanged(user);
        } else {
          handleSignOut(new Error('User is not valid'));
        }
      } else {
        setAuthState({
          isLoaded: true,
          user: null,
          userId: null,
          isValid: false,
          token: null,
          error: null
        });
        onUserChanged && await onUserChanged(null);
      }
    }, (error) => {
      setAuthState({
        isLoaded: true,
        user: null,
        userId: null,
        isValid: false,
        token: null,
        error: error instanceof Error ? error : new Error('Authentication error occurred')
      });
    });

    unsubscribeIdToken = onIdTokenChanged(auth, async (user) => {
      if (user) {
        const { isValid, token } = await checkUserValidity(user);
        if (isValid) {
          setAuthState(prev => ({
            ...prev,
            isValid: true,
            token,
          }));
        } else {
          handleSignOut(new Error('User token is not valid'));
        }
      }
    });

    return () => {
      unsubscribeAuthState();
      unsubscribeIdToken();
    };
  }, [auth, handleSignOut, checkUserValidity, onUserChanged]);

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

