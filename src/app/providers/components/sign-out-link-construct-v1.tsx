"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { signOut } from "firebase/auth"
import { ternSecureAuth } from "../utils/client-init"
import { clearSessionCookie } from '../server/SessionAdmin'
import { cn } from "@/lib/utils"
import Link from "next/link"

interface SignOutLinkProps {
  children?: React.ReactNode
  onError?: (error: Error) => void
  onSignOutSuccess?: () => void
  className?: string
  activeClassName?: string
  disabled?: boolean
  redirectPath?: string
}

export function SignOutLink({
  children = "Sign out",
  onError,
  onSignOutSuccess,
  className,
  activeClassName,
  disabled = false,
  redirectPath,
}: SignOutLinkProps) {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()
  const loginPath = process.env.NEXT_PUBLIC_LOGIN_PATH || "/sign-in"

  const handleSignOut = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    if (disabled || isLoading) return

    setIsLoading(true)
    try {
      // Sign out from Firebase
      await signOut(ternSecureAuth)

      // Clear the session cookie
      await clearSessionCookie()

      // Call success callback if provided
      onSignOutSuccess?.()

      // Build the login URL with redirect
      const redirectUrl = redirectPath || pathname

      // Ensure we're not redirecting to the login page itself
      if (redirectUrl && !redirectUrl.startsWith(loginPath)) {
        // Use URLSearchParams to properly encode the parameters
        const searchParams = new URLSearchParams({
          redirect_url: redirectUrl,
        }).toString()

        // Construct the full URL with encoded parameters
        const fullLoginPath = `${loginPath}?${searchParams}`

        // Use window.location for a full page navigation that preserves the query parameters
        window.location.href = fullLoginPath
      } else {
        // If no redirect or redirecting to login, just go to login
        window.location.href = loginPath
      }
    } catch (error) {
      console.error("Sign out error:", error)
      onError?.(error instanceof Error ? error : new Error("Failed to sign out"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Link
      href="#"
      onClick={handleSignOut}
      className={cn(
        "text-sm font-medium transition-colors hover:text-primary",
        disabled && "pointer-events-none opacity-50",
        isLoading && "pointer-events-none",
        className,
        isLoading && activeClassName,
      )}
      aria-disabled={disabled || isLoading}
    >
      {isLoading ? "Signing out..." : children}
    </Link>
  )
}

