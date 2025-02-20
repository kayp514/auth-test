'use client'

import { useCallback, useState } from 'react'
import { useSocket } from '../internal/SocketCtx'
import type { UserStatus } from "@/app/providers/utils/socket"

interface PresenceUpdate {
    userId: string
    presence: {
      status: UserStatus
      lastUpdated: string
      socketId: string
    }
}

export function usePresence() {
  const { setPresence } = useSocket()
  const [currentPresence, setCurrentPresence] = useState<PresenceUpdate | null>(null)

  const updatePresence = useCallback((status: UserStatus, customMessage?: string) => {
    setPresence({ status, customMessage })
  }, [setPresence])

  return { updatePresence }
}