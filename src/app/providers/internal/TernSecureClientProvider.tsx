'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { onAuthStateChanged, User } from 'firebase/auth'
import { ternSecureAuth } from '../utils/client-init'
import { TernSecureCtxValue, TernSecureCtx } from './TernSecureCtx'
import type { TernSecureState, SignInResponse, AuthError } from '../utils/types'
import { ERRORS } from '../utils/errors'
import { constructUrlWithRedirect } from '../utils/construct'

/**
 * @internal
 * Internal provider props - not meant for direct usage
 */
interface TernSecureClientProviderProps {
  children: React.ReactNode
  /** Callback when user state changes */
  onUserChanged?: (user: User | null) => Promise<void>
  /** Login page path */
  loginPath?: string
  /** Signup page path */
  signUpPath?: string
  /** Custom loading component */
  loadingComponent?: React.ReactNode
  /** Whether email verification is required */
  requiresVerification: boolean
}

/**
 * @internal
 * Internal provider component that handles authentication state
 * This is wrapped by the public TernSecureProvider
 */


export function TernSecureClientProvider({ 
  children,
  loginPath = process.env.NEXT_PUBLIC_LOGIN_PATH || '/sign-in',
  signUpPath = '/sign-up',
  loadingComponent,
  requiresVerification,
}: TernSecureClientProviderProps) {
  const auth = useMemo(() => ternSecureAuth, [])
  const router = useRouter()
  const pathname = usePathname()
  const [isRedirecting, setIsRedirecting] = useState(false)
  
  const [authState, setAuthState] = useState<TernSecureState>(() => ({
    userId: null,
    isLoaded: false,
    error: null,
    isValid: false,
    isVerified: false,
    isAuthenticated: false,
    token: null,
    email: null,
    status: "loading",
    requiresVerification,
  }));


  const constructUrlWithRedirect = (
    loginPath: string,
    currentPath: string,
    loginPathParam: string,
    signUpPathParam: string,
  ): string => {
    const baseUrl = window.location.origin
    const signInUrl = new URL(loginPath, baseUrl)

    // Only add redirect if not already on login or signup page
    if (!currentPath.includes(loginPathParam) && !currentPath.includes(signUpPathParam)) {
      signInUrl.searchParams.set("redirect", currentPath)
    }
    return signInUrl.toString()
  }

  const redirectToLogin = useCallback(
    (currentPath?: string) => {
      const path = currentPath || pathname || "/"
      setIsRedirecting(true)

      const loginUrl = constructUrlWithRedirect(loginPath, path, loginPath, signUpPath)
      router.push(loginUrl)
  }, 
  [router, loginPath, signUpPath, pathname]
)


  const handleSignOut = useCallback(async (error?: Error) => {
    const currentPath = window.location.pathname
      await auth.signOut()
      setAuthState({
        isLoaded: true,
        userId: null,
        error: error || null,
        isValid: false,
        token: null,
        email: null,
        isVerified: false,
        isAuthenticated: false,
        status: "unauthenticated",
        requiresVerification,
      })

      //const redirectUrl = redirectPath || pathname
      //const fullLoginUrl = constructUrlWithRedirect(loginPath, redirectUrl, loginPath)
      //window.location.href = fullLoginUrl
      redirectToLogin(currentPath)

  }, [auth, redirectToLogin, requiresVerification])

  const setEmail = useCallback((email: string) => {
    setAuthState((prev) => ({
      ...prev,
      email,
    }))
  }, [])

  const getAuthError = useCallback((): SignInResponse => {
    if (authState.error) {
      const error = authState.error as AuthError;
      return {
        success: false,
        message: error.message,
        error: error.code as keyof typeof ERRORS,
        user: null,
      }
    }

    if (authState.requiresVerification && authState.isValid && !authState.isVerified) {
      return {
        success: false,
        message: 'Email verification required',
        error: 'EMAIL_NOT_VERIFIED',
        user: null,
      }
    }

    if (!authState.isAuthenticated && authState.status !== "loading") {
      return {
        success: false,
        message: 'User is authenticated',
        error: 'AUTHENTICATED',
        user: null,
      }
    }

    return {
      success: true,
      user: ternSecureAuth.currentUser,
    }
  }, [
    authState.error,
    authState.isValid,
    authState.isVerified,
    authState.isAuthenticated,
    authState.status,
    authState.requiresVerification,
  ])

  useEffect(() => {
    let mounted = true
    let initialLoad = true

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user: User | null) => {
        if (!mounted) return
        try {
          if (user) {
            const isValid = !!user.uid;
            const isVerified = user.emailVerified;
            const isAuthenticated = isValid && (!requiresVerification || isVerified)

            setAuthState({
              isLoaded: true,
              userId: user.uid,
              isValid,
              isVerified,
              isAuthenticated: isValid && isVerified,
              token: user.getIdToken(),
              error: null,
              email: user.email,
              status: isAuthenticated ? "authenticated" : "unverified",
              requiresVerification,
            })

            if (requiresVerification && !isVerified && !pathname?.includes(signUpPath)) {
              if(initialLoad || !isRedirecting) {
                redirectToLogin(pathname)
              }
            }
          } else {
            setAuthState({
              isLoaded: true,
              userId: null,
              isValid: false,
              isVerified: false,
              isAuthenticated: false,
              token: null,
              error: null,
              email: null,
              status: "unauthenticated",
              requiresVerification,
            })


            if (!pathname.includes(signUpPath) && initialLoad) {
              redirectToLogin()
            }
          }

      } catch (error) {
        console.error('Auth state change error:', error)
        if (mounted) {
          handleSignOut(error instanceof Error ? error : new Error("Authentication error occurred"))
        }
      } finally {
        initialLoad = false
      }
    })
    
    return () => {
      mounted = false
      unsubscribe()
    }
  }, [auth, handleSignOut, requiresVerification, signUpPath, redirectToLogin, pathname, isRedirecting])

  const contextValue: TernSecureCtxValue = useMemo(() => ({
    ...authState,
    signOut: handleSignOut,
    setEmail,
    getAuthError,
    redirectToLogin,
  }), [authState, handleSignOut, setEmail, getAuthError, redirectToLogin])

  if (!authState.isLoaded) {
    return (
      <TernSecureCtx.Provider value={contextValue}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </TernSecureCtx.Provider>
    )
  }

  return (
    <TernSecureCtx.Provider value={contextValue}>
      {children}
    </TernSecureCtx.Provider>
  )
}