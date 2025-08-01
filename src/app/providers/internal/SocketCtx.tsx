'use client'

import { createContext, useContext } from "react"
import { Socket } from 'socket.io-client'
import type {
  PresenceUpdate,
  ClientToServerEvents, 
  Presence
 } from "@/app/providers/utils/socket"



export interface SocketCtxState {property: string}

export interface SocketCtxActions {property: string}

export interface SocketCtxValue extends SocketCtxState, SocketCtxActions {}

const initialState: SocketCtxValue = {
  property: "initial value"
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