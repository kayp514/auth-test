"use client"

import { useTernSecure } from '../internal/TernSecureCtx'

export function useSignUp() {
  const {
    email,
    setEmail
  } = useTernSecure('useSignUp')

  return {
    email, 
    setEmail
  }
}
