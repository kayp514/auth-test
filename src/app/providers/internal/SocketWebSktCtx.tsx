'use client'

import { createContext, useContext } from "react"
import { Socket } from 'socket.io-client'
import type {
  PresenceUpdate,
  ClientToServerEvents, 
  Presence
 } from "@/app/providers/utils/socket"



export interface SocketWebSktCtxState {
  socket: Socket<any, ClientToServerEvents> | null
  isConnected: boolean
  connectionError: string | null
  notifications: Notification[]
  socketId: string | null
  presenceState: Map<string, PresenceUpdate> 
  clientId: string
  sessionId: string | null
}

export interface SocketWebSktCtxActions {
  sendNotification: (type: string, message: string, data?: Record<string, unknown>) => Promise<void>
  setPresence: (presence: Presence) => void
  disconnect: () => void
  clearNotifications: () => void
}

export interface SocketWebSktCtxValue extends SocketWebSktCtxState, SocketWebSktCtxActions {}

const initialState: SocketWebSktCtxValue = {
  socket: null,
  isConnected: false,
  connectionError: null,
  notifications: [],
  presenceState: new Map(), 
  socketId: null,
  clientId: '',
  sessionId: null,
  sendNotification: async () => {},
  setPresence: () => {},
  disconnect: () => {},
  clearNotifications: () => {},

}

export const SocketWebSktCtx = createContext<SocketWebSktCtxValue>(initialState)
SocketWebSktCtx.displayName = "SocketWebSocketContext"

export function useWebSkt() {
  const context = useContext(SocketWebSktCtx)
  if (!context) {
    throw new Error("useWebSkt must be used within a SocketWebSktProvider")
  }
  return context
}