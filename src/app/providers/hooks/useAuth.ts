"use client"

import { useTernSecure } from '../internal/TernSecureCtx'
import {  User } from 'firebase/auth'
import { TernSecureUser } from '../internal/TernSecureCtx'

export function useAuth() {
  const {
    userId,
    isLoaded,
    error,
    isValid,
    signOut
  } = useTernSecure('useAuth')

  const user: User | null = TernSecureUser()


  return {
    user,
    userId,
    isLoaded,
    error,
    isAuthenticated: isValid,
    signOut
  }
}
