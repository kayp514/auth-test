'use client'

import { useCallback, useMemo } from 'react'
import { useSocket } from '../internal/SocketCtx'
import type { UserStatus } from "@/app/providers/utils/socket"
import { useWebSkt } from '../internal/SocketWebSktCtx'


export function usePresence() {
  const { setPresence, presenceState } = useWebSkt()

  //console.log('Raw presenceState:', presenceState) // Debug log

  const presenceUpdates = useMemo(() => 
    Array.from(presenceState.values()), 
    [presenceState]
  )

  //console.log('Processed presenceUpdates:', presenceUpdates) // Debug log

  const updatePresence = useCallback((status: UserStatus, customMessage?: string) => {
    setPresence({ status, customMessage })
  }, [setPresence])

  return { 
    updatePresence,
    presenceState,
    presenceUpdates
  }
}