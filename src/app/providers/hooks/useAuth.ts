
import { useTernSecure } from '../internal/TernSecureCtx'
import {  User } from 'firebase/auth'
import { TernSecureUser } from '../internal/TernSecureCtx'
import type { SignInResponse } from '../utils/types'

export function useAuth() {
  const {
    userId,
    isLoaded,
    error,
    isValid,
    isVerified,
    isAuthenticated,
    token,
    getAuthError,
    status,
    requiresVerification,
    signOut
  } = useTernSecure('useAuth')

  const user: User | null = TernSecureUser()
  const authResponse: SignInResponse = getAuthError()


  return {
    user,
    userId,
    isLoaded,
    error: authResponse.success ? null : authResponse,
    isValid,         // User is signed in
    isVerified,      // Email is verified
    isAuthenticated, // User is both signed in and verified
    token,
    status,
    requiresVerification,
    signOut
  }
}