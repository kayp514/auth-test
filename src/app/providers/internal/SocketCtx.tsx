'use client'

import { createContext, useContext } from "react"
import { Socket } from 'socket.io-client'
import type { UserStatus, PresenceUpdate } from "@/app/providers/utils/socket"

export interface Presence {
  status: UserStatus
  customMessage?: string
}

{/*export interface PresenceUpdate {
  userId: string
  presence: {
    status: UserStatus
    customMessage?: string
    lastUpdated: string
    socketId: string
  }
}*/}


export interface Notification {
  id: string
  type: NotificationType
  message: string
  timestamp: string
  data?: Record<string, unknown>
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface SocketCtxState {
  socket: Socket | null
  isConnected: boolean
  connectionError: string | null
  notifications: Notification[]
  socketId: string | null
  presenceUpdates: PresenceUpdate[]
}

export interface SocketCtxActions {
  sendNotification: (type: string, message: string, data?: Record<string, unknown>) => Promise<void>
  setPresence: (presence: Presence) => void
  disconnect: () => void
  clearNotifications: () => void
}

export interface SocketCtxValue extends SocketCtxState, SocketCtxActions {}

const initialState: SocketCtxValue = {
  socket: null,
  isConnected: false,
  connectionError: null,
  notifications: [],
  presenceUpdates: [],
  socketId: null,
  sendNotification: async () => {},
  setPresence: () => {},
  disconnect: () => {},
  clearNotifications: () => {}
}

export const SocketCtx = createContext<SocketCtxValue>(initialState)
SocketCtx.displayName = "SocketContext"

export function useSocket() {
  const context = useContext(SocketCtx)
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}