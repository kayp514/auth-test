'use client'

import { type ReactNode } from "react"
import { Toaster } from "@/components/ui/sonner"
import type { SocketConfig } from "@/app/providers/utils/socket"
import { SocketAuthProvider } from "./SocketAuthProvider"
import { SocketWebSktProvider } from "./SocketWebSktProvider"
import { useSocketAuth } from "./SocketAuthCtx"
import { ConnectionProgress } from "@/components/connection-status"


interface SocketProviderProps {
  children: ReactNode
  config: SocketConfig
}

function SocketConnectionManager({ children, config }: SocketProviderProps) {
  const { connectionState } = useSocketAuth()

  // Only render the WebSocket provider and children when auth is complete
  if (connectionState !== "ready_for_socket") {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-background">
        <ConnectionProgress />
      </div>
    )
  }

  return <SocketWebSktProvider config={config}>{children}</SocketWebSktProvider>
}

export const SocketProvider = ({ children, config }: SocketProviderProps) => {
  return (
    <SocketAuthProvider config={config}>
      <SocketConnectionManager config={config}>
        {children}
        <Toaster position="top-center" />
      </SocketConnectionManager>
    </SocketAuthProvider>
  );
};