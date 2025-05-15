//v2: redict with taking priority from the sign-in page
'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { Button, type ButtonProps } from '@/components/ui/button'
import { ternSecureAuth } from '../utils/client-init'
import { clearSessionCookie } from '../server/sessionTernSecure'
import { constructUrlWithRedirect } from '../utils/construct-v2'

type SignOutCustomProps = {
  children?: React.ReactNode
  onError?: (error: Error) => void
  onSignOutSuccess?: () => void
  redirectPath?: string
}

type SignOutProps = Omit<ButtonProps, 'onClick'> & SignOutCustomProps

export function SignOut({ 
  children = 'Sign out', 
  onError,
  onSignOutSuccess,
  redirectPath,
  ...buttonProps 
}: SignOutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const loginPath = process.env.NEXT_PUBLIC_LOGIN_PATH || '/sign-in'

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      // Sign out from Firebase
      await signOut(ternSecureAuth)
      
      // Clear the session cookie
      await clearSessionCookie()
      
      // Call success callback if provided
      onSignOutSuccess?.()
      
      // Construct login URL with redirect parameter
      const loginUrl = constructUrlWithRedirect(loginPath, pathname)
      
      // Use router for development and window.location for production
      if (process.env.NODE_ENV === "production") {
        window.location.href = loginUrl
      } else {
        router.push(loginUrl)
      }
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

