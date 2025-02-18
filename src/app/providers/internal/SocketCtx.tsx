'use client'

import { createContext, useContext } from "react"
import { Socket } from 'socket.io-client';

interface SocketCtxType {
    socket: Socket | null
    isConnected: boolean
    connectionError: string | null
    notifications: Notification[]
    sendNotification: (type: string, message: string, data?: any) => Promise<void>
    socketId: string | null;  
    disconnect: () => void
}

export interface Notification {
    id: string;
    type: string;
    message: string;
    timestamp: string;
    data?: any;
}
  
export const SocketCtx = createContext<SocketCtxType>({
    socket: null,
    isConnected: false,
    notifications: [],
    connectionError: null,
    sendNotification: async () => {},
    socketId: null,
    disconnect: () => {},
})

SocketCtx.displayName = "SocketCtx"

export function useSocket() {
    const ctx =  useContext(SocketCtx)

    if (!ctx) {
        throw new Error("useSocket must be used within a SocketProvider")
    }

    return ctx
}