'use client'

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { toast } from "sonner"
import { io, type Socket } from "socket.io-client"
import { v4 as uuidv4 } from 'uuid'
import { 
  SocketCtx, 
  type SocketCtxState,
} from "./SocketCtx"


import type {  PresenceUpdate, Presence, SocketConfig } from "@/app/providers/utils/socket"
import { getStoredSessionId, storeSessionId } from "@/app/providers/utils/socketSessionConfig"


// Constants
const SOCKET_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_SOCKET_URL,
  //baseUrl: 'http://localhost:3001',
  room: 'notifications',
  reconnectionAttempts: 5,
  reconnectionDelay: 10000,
  connectionTimeout: 60000,
} as const

// Types
interface SocketProviderProps {
  children: ReactNode
  config: SocketConfig
}

interface SocketEventHandlers {
  onConnect: () => void
  onDisconnect: (reason: string) => void
  onConnectError: (error: Error) => void
  onRecentNotification: (data: unknown) => void
  onNotification: (notification: Notification) => void
  onPresenceUpdate: (data: PresenceUpdate) => void
  onPresenceEnter: (data: PresenceUpdate) => void
  onPresenceLeave: (data: { clientId: string }) => void
  onPresenceSync: (updates: PresenceUpdate[]) => void
  onSession: (data: { sessionId: string }) => void
}

// Helper functions
const createSocketInstance = ({ 
  config,
  sessionId 
}: { 
  config: SocketConfig,
  sessionId: string | null
}) => {
  return io(SOCKET_CONFIG.baseUrl, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: SOCKET_CONFIG.reconnectionAttempts,
    reconnectionDelay: SOCKET_CONFIG.reconnectionDelay,
    timeout: SOCKET_CONFIG.connectionTimeout,
    autoConnect: true,
    auth: {
      clientId: config.clientId,
      apiKey: config.apiKey,
      sessionId
    }
  })
}

const validateNotificationData = (data: unknown): data is { notifications: Notification[] } => {
  return Boolean(
    data && 
    typeof data === 'object' && 
    'notifications' in data && 
    Array.isArray((data as any).notifications)
  )
}

export function SocketProvider({ children, config }: SocketProviderProps) {

  const initialSessionId = useRef(getStoredSessionId(config));

  const [state, setState] = useState<SocketCtxState>({
    socket: null,
    isConnected: false,
    connectionError: null,
    notifications: [],
    socketId: null,
    presenceState: new Map(),
    clientId: config.clientId,
    sessionId: initialSessionId.current
  })
  
  const connectionAttempted = useRef(false)
  const configRef = useRef(config)

  // Update config ref if config changes
  //useEffect(() => {
   // configRef.current = config;
 // }, [config]);

  // Event Handlers
  const createEventHandlers = useCallback((socketInstance: Socket): SocketEventHandlers => ({
    onConnect: () => {
      console.log("Socket connected with ID:", socketInstance.id)
      setState((prev: SocketCtxState) => ({
        ...prev,
        isConnected: true,
        connectionError: null,
        socketId: socketInstance.id ?? null
      }))
    },

    onDisconnect: (reason: string) => {
      console.log("Socket disconnected:", reason)
      setState(prev => ({
        ...prev,
        isConnected: false,
        socketId: null
      }))
    },

    onSession: ({ sessionId }: { sessionId: string }) => {
      console.log("Received session ID:", sessionId)
      
      // Store the sessionId in configured storage
      storeSessionId(sessionId, configRef.current);
      
      // Update socket auth for reconnections
      if (socketInstance.auth) {
        socketInstance.auth = {
          ...socketInstance.auth,
          sessionId
        };
      }
      
      // Update state with the new sessionId
      setState(prev => ({
        ...prev,
        sessionId
      }))
    },

    onConnectError: (error: Error) => {
      console.error("Socket connection error:", error)

      toast.error("Connection error", {
        description: "Failed to connect to the server. Please check your internet connection.",
        duration: 5000,
      })

      setState(prev => ({
        ...prev,
        connectionError: error.message,
        isConnected: false,
        socketId: null
      }))
    },

    onRecentNotification: (data: unknown) => {
      console.log("Recent notifications received:", data)
      if (validateNotificationData(data)) {
        setState(prev => ({
          ...prev,
          notifications: data.notifications
        }))
      }
    },

    onNotification: (notification: Notification) => {
      console.log("New notification received:", notification)
      setState(prev => ({
        ...prev,
        notifications: [...prev.notifications, notification]
      }))
    }, 

    onPresenceEnter: (data: PresenceUpdate) => {
      console.log('Presence enter received:', data)
      if (data.clientId === config.clientId) {
        console.log('Received own presence enter - ignoring');
        return;
      }
      setState(prev => ({
        ...prev,
        presenceState: new Map(prev.presenceState).set(data.clientId, data)
      }))
    },

    onPresenceUpdate: (data: PresenceUpdate) => {
      console.log('Presence update received:', { data, currentClientId: config.clientId });
      setState(prev => ({
        ...prev,
        presenceState: new Map(prev.presenceState).set(data.clientId, data)
      }))
    },

    onPresenceSync: (updates: PresenceUpdate[]) => {
      console.log('Presence sync received:', updates);
      setState(prev => {
        const newPresenceState = new Map();
        updates.forEach(update => {
          newPresenceState.set(update.clientId, update);
        });
        return { ...prev, presenceState: newPresenceState };
      });
    },

    onPresenceLeave: ({ clientId }: { clientId: string }) => {
      console.log('Presence leave:', clientId)
      setState(prev => {
        const newPresenceState = new Map(prev.presenceState)
        newPresenceState.delete(clientId)
        return { ...prev, presenceState: newPresenceState }
      })
    },

  }), [])

  // Socket initialization
  useEffect(() => {
    if (connectionAttempted.current) return

    connectionAttempted.current = true

    try {
      const socketInstance = createSocketInstance({ 
        config,
        sessionId: initialSessionId.current 
      })
      const handlers = createEventHandlers(socketInstance)

      // Attach event listeners
      socketInstance.on("connect", handlers.onConnect)
      socketInstance.on("disconnect", handlers.onDisconnect)
      socketInstance.on("session", handlers.onSession) 
      socketInstance.on("connect_error", handlers.onConnectError)
      socketInstance.on("presence:enter", handlers.onPresenceEnter)
      socketInstance.on("presence:update", handlers.onPresenceUpdate)
      socketInstance.on("presence:sync", handlers.onPresenceSync)
      socketInstance.on("presence:leave", handlers.onPresenceLeave)
      socketInstance.on("recent_notification", handlers.onRecentNotification)
      socketInstance.on("notification", handlers.onNotification)

      setState(prev => ({ ...prev, socket: socketInstance }))

      // Cleanup
      return () => {
        socketInstance.off("connect", handlers.onConnect)
        socketInstance.off("disconnect", handlers.onDisconnect)
        socketInstance.off("session", handlers.onSession)
        socketInstance.off("connect_error", handlers.onConnectError)
        socketInstance.off("presence:enter", handlers.onPresenceEnter)
        socketInstance.off("presence:update", handlers.onPresenceUpdate)
        socketInstance.off("presence:sync", handlers.onPresenceSync)
        socketInstance.off("presence:leave", handlers.onPresenceLeave)
        socketInstance.off("recent_notification", handlers.onRecentNotification)
        socketInstance.off("notification", handlers.onNotification)
        socketInstance.disconnect()
        connectionAttempted.current = false
      }
    } catch (error) {
      console.error("Socket initialization error:", error)

      toast.error("Connection error", {
        description: "Failed to initialize socket connection. Please try again later.",
        duration: 5000,
      })
      
      setState(prev => ({
        ...prev,
        connectionError: "Failed to initialize socket connection"
      }))
      connectionAttempted.current = false
    }
  }, [createEventHandlers])

  // Actions
  const sendNotification = useCallback(async (
    type: string, 
    message: string, 
    data: Record<string, unknown> = {}
  ) => {
    try {
      if (!state.isConnected || !state.socket) {
        throw new Error('Socket not connected')
      }

      const notification = {
        id: uuidv4(),
        type,
        message,
        data: {
          ...data,
          timestamp: new Date().toISOString()
        }
      }

      const response = await fetch('/api/real', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send notification')
      }

      return await response.json()
    } catch (err) {
      setState(prev => ({
        ...prev,
        connectionError: err instanceof Error ? err.message : 'Error sending notification'
      }))
      throw err
    }
  }, [state.isConnected, state.socket])

  const disconnect = useCallback(() => {
    if (state.socket) {
      state.socket.disconnect()
      setState(prev => ({
        ...prev,
        socket: null,
        isConnected: false,
        connectionError: null,
        socketId: null
      }))
      connectionAttempted.current = false
    }
  }, [state.socket])

  const clearNotifications = useCallback(() => {
    setState(prev => ({ ...prev, notifications: [] }))
  }, [])

  const setPresence = useCallback((presence: Presence) => {
    console.log('Setting presence:', { clientId: config.clientId, presence });
    if (state.socket && state.isConnected) {
      state.socket.emit('presence:update', presence);
    } else {
      console.warn('Cannot set presence - socket not connected');
    }
  }, [state.socket, state.isConnected, config.clientId]);


  return (
    <SocketCtx.Provider
      value={{
        ...state,
        sendNotification,
        disconnect,
        clearNotifications,
        setPresence,
      }}
    >
      {children}
    </SocketCtx.Provider>
  )
}