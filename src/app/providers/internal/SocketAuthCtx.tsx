'use client'

import { createContext, useContext } from "react"


 type ConnectionState = 
  | 'idle' 
  | 'authenticating'
  | 'exchanging_keys'
  | 'ready_for_socket'
  | 'connecting_socket'
  | 'connected'
  | 'error';


export interface SocketAuthCtxState {
  authError: string | null;
  keyExchangeError: string | null
  sessionId: string | null;
  connectionState: ConnectionState;

}

export interface SocketAuthCtxActions {
    authenticate: () => {};
    exchangeKeys: (sessionId: string) => Promise<void>;
    reAuthenticate: () => Promise<void>;
  }


export interface SocketAuthCtxValue extends SocketAuthCtxState, SocketAuthCtxActions {}

const initialState: SocketAuthCtxValue = {
    authError: null,
    sessionId: null,
    connectionState: 'idle',
    keyExchangeError: null, 
    authenticate: async () => {},
    exchangeKeys: async () => {},
    reAuthenticate: async () => {}
}

export const SocketAuthCtx = createContext<SocketAuthCtxValue>(initialState)
SocketAuthCtx.displayName = "SocketAuthContext"

export function useSocketAuth() {
  const context = useContext(SocketAuthCtx)
  if (!context) {
    throw new Error("useSocketAuth must be used within a SocketProvider")
  }
  return context
}