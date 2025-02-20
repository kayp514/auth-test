'use client'

import { useCallback } from 'react'
import { useSocket } from '../internal/SocketCtx'
import type { UserStatus } from "@/app/providers/utils/socket"


export function usePresence() {
  const { setPresence, presenceUpdates  } = useSocket()

  const updatePresence = useCallback((status: UserStatus, customMessage?: string) => {
    setPresence({ status, customMessage })
  }, [setPresence])

  return { 
    updatePresence,
    presenceUpdates
  }
}