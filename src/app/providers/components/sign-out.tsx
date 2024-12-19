'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { Button, type ButtonProps } from '@/components/ui/button'
import { ternSecureAuth } from '../utils/client-init'
import { clearSessionCookie } from '../server/sessionTernSecure'

type SignOutCustomProps = {
  children?: React.ReactNode
  onError?: (error: Error) => void
  onSignOutSuccess?: () => void
}

type SignOutProps = Omit<ButtonProps, 'onClick'> & SignOutCustomProps

export function SignOut({ 
  children = 'Sign out', 
  onError,
  onSignOutSuccess,
  ...buttonProps 
}: SignOutProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      // Sign out from Firebase
      await signOut(ternSecureAuth)
      
      // Clear the session cookie
      await clearSessionCookie()
      
      // Call success callback if provided
      onSignOutSuccess?.()
      
      // Redirect to sign-in page
      router.push('/sign-in')
    } catch (error) {
      console.error('Sign out error:', error)
      onError?.(error instanceof Error ? error : new Error('Failed to sign out'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleSignOut}
      disabled={isLoading}
      {...buttonProps}
    >
      {isLoading ? 'Signing out...' : children}
    </Button>
  )
}

