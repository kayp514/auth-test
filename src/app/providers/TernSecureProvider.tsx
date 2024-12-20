import React from "react"
import { TernSecureClientProvider } from "../providers/internal/TernSecureClientProvider"
import { verifyUser } from "../providers/server/sessionTernSecure"




interface TernSecureProviderProps {
  children: React.ReactNode
}

/**
 * Root Provider for TernSecure
 * Use this in your Next.js App Router root layout
 * Automatically handles client/server boundary and authentication state
 * 
 * @example
 * ```tsx
 * // app/layout.tsx
 * import { TernSecureProvider } from '@tern/secure'
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <TernSecureProvider>
 *           {children}
 *         </TernSecureProvider>
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */

export async function TernSecureProvider({ 
  children
}: TernSecureProviderProps) {
  // Verify user status server-side before mounting client provider
  const userStatus = await verifyUser()
  const loginPath = process.env.NEXT_PUBLIC_LOGIN_PATH || '/sign-in'
  
  return (
    <TernSecureClientProvider
      loginPath={loginPath}
      initialUserStatus={userStatus}
      >
      {children}
    </TernSecureClientProvider>
  )
}
