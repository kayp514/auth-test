'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { onAuthStateChanged, User } from 'firebase/auth'
import { ternSecureAuth } from '../utils/client-init'
import { TernSecureState, TernSecureCtxValue, TernSecureCtx } from './TernSecureCtx'
import { UserStatus } from '../server/sessionTernSecure'



interface TernSecureClientProviderProps {
  children: React.ReactNode
  initialUserStatus: UserStatus
  loginPath?: string
}

export function TernSecureClientProvider({ 
  children,
  initialUserStatus,
  loginPath = process.env.NEXT_PUBLIC_LOGIN_PATH || '/sign-in'
}: TernSecureClientProviderProps) {
  const auth = useMemo(() => ternSecureAuth, [])
  const router = useRouter()
  const pathname = usePathname()
  
  const [authState, setAuthState] = useState<TernSecureState>(() => ({
    userId: initialUserStatus.userId || null,
    isLoaded: true,
    error: initialUserStatus.error ? new Error(initialUserStatus.error) : null,
    isValid: initialUserStatus.isValid,
  }))

  const handleSignOut = useCallback(async (redirectPath?: string) => {
    try {
      await auth.signOut()
      setAuthState({
        isLoaded: true,
        userId: null,
        error: null,
        isValid: false,
      })

      const redirectUrl = redirectPath || pathname

      if (redirectUrl && !redirectUrl.startsWith(loginPath)) {
        const searchParams = new URLSearchParams({
          redirect_url: redirectUrl
        }).toString()

        const fullLoginPath = `${loginPath}?${searchParams}`
        window.location.href = fullLoginPath
      } else {
        window.location.href = loginPath
      }
    } catch (signOutError) {
      console.error('Error during sign out:', signOutError)
      setAuthState(prev => ({
        ...prev,
        error: signOutError instanceof Error ? signOutError : new Error('Failed to sign out'),
      }))
    }
  }, [auth, pathname, loginPath])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user: User | null) => {
        try {
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


            if (!pathname.startsWith(loginPath)) {
              const searchParams = new URLSearchParams({
                redirect_url: pathname
              }).toString()

              const fullLoginPath = `${loginPath}?${searchParams}`
              window.location.href = fullLoginPath
            }
          }
        } catch (error) {
          console.error('Error in auth state change:', error)
          handleSignOut()
        }
      },
      (error) => {
        console.error('Auth state change error:', error)
        handleSignOut()
      }
    )
    
    return () => unsubscribe()
  }, [auth, handleSignOut, router, pathname, loginPath])

  const contextValue: TernSecureCtxValue = useMemo(() => ({
    ...authState,
    signOut: handleSignOut,
  }), [authState, handleSignOut])

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