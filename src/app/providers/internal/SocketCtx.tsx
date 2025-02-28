'use client'

import { createContext, useContext } from "react"
import { Socket } from 'socket.io-client'
import type {
  PresenceUpdate,
  ClientToServerEvents, 
  Presence
 } from "@/app/providers/utils/socket"


export interface SocketCtxState {
  socket: Socket<any, ClientToServerEvents> | null
  isConnected: boolean
  connectionError: string | null
  notifications: Notification[]
  socketId: string | null
  presenceState: Map<string, PresenceUpdate> 
  clientId: string
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
  presenceState: new Map(), 
  socketId: null,
  clientId: '',
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