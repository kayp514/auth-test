"use client"

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { io, type Socket } from "socket.io-client"
import { SocketCtx, type Notification } from "./SocketCtx"
import { useAuth } from "@/app/providers/hooks/useAuth" 


const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL
const NOTIFICATION_ROOM = 'notifications'; // Define the room name

const RECONNECTION_ATTEMPTS = 5
const RECONNECTION_DELAY = 1000
const CONNECTION_TIMEOUT = 60000

interface SocketProviderProps {
  children: ReactNode
}


export function SocketProvider({ children }: SocketProviderProps) {
  const { user } = useAuth() 
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const connectionAttempted = useRef(false)
  const [socketId, setSocketId] = useState<string | null>(null);

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (connectionAttempted.current || socket) return

    connectionAttempted.current = true
    

    try {
      const socketInstance = io(baseUrl, {
        transports: ["polling"],
        reconnection: true,
        reconnectionAttempts: RECONNECTION_ATTEMPTS,
        reconnectionDelay: RECONNECTION_DELAY,
        timeout: CONNECTION_TIMEOUT,
        autoConnect: true,
      })

      setSocket(socketInstance)
      return socketInstance
    } catch (error) {
      console.error("Socket initialization error:", error)
      setConnectionError("Failed to initialize socket connection")
      connectionAttempted.current = false
      return null
    }
  }, [socket])

  // Handle socket events
  useEffect(() => {
    if (!socket) return

    const handleConnect = () => {
    const engine = socket.io.engine;
    console.log(engine.transport.name);

    engine.once('upgrade', () => {
        console.log(engine.transport.name);
    });

      console.log("Socket connected")
      setIsConnected(true)
      setConnectionError(null)
      setSocketId(socket.id || null);
      socket.emit('join', NOTIFICATION_ROOM);

      console.log('Socket ID (room):', socket.id);
    }

    const handleDisconnect = (reason: string) => {
      console.log("Socket disconnected:", reason)
      setIsConnected(false)
    }

    const handleConnectError = (error: Error) => {
      console.error("Socket connection error:", error)
      setConnectionError(error.message)
      setIsConnected(false)
    }

    const handleRecentNotification = (data: any) => {
        console.log("Recent notification received:", data);
        if(data && Array.isArray(data.notifications)) {
            setNotifications(data.notifications);
        } else {
            console.error('Invalid recent_notifications data:', data);
        }
    };

    const handleNotification = (notifications: any) => {
        console.log("notification received:", notifications);
        setNotifications((prevNotifications) => [...prevNotifications, notifications]);
    };


    // Set up event listeners
    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)
    socket.on("connect_error", handleConnectError)
    socket.on("recent_notification", handleRecentNotification);
    socket.on("notification", handleNotification);

    // Clean up event listeners
    return () => {
      socket.off("connect", handleConnect)
      socket.off("disconnect", handleDisconnect)
      socket.off("connect_error", handleConnectError)
      socket.off("recent_notification", handleRecentNotification)
      socket.off("notification", handleNotification);
    }
  }, [socket, user?.uid])

  // Initialize user
  const initializeUser = useCallback(
    (userId: string) => {
      if (!socket || !isConnected) {
        initializeSocket()
        return
      }

      if(user?.uid) {
        socket.emit("initialize", userId)
      }
    },
    [socket, isConnected, initializeSocket, user],
  )


  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
      setIsConnected(false)
      setConnectionError(null)
      connectionAttempted.current = false
    }
  }, [socket])

  const sendNotification = useCallback(async (type: string, message: string, data: any = {}) => {
    try {
      if (!isConnected || !socket) {
        throw new Error('Socket not connected');
      }

      const response = await fetch('/api/real', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          message,
          data: {
            ...data,
            timestamp: new Date().toISOString()
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }
    } catch (err) {
      setConnectionError(err instanceof Error ? err.message : 'Error sending notification');
      throw err;
    }
  }, [socket, isConnected]);

  // Auto-initialize socket on mount
  useEffect(() => {
    if (!socket && !connectionAttempted.current) {
      initializeSocket()
    }
    // Cleanup on unmount
    return () => {
        if(socket) {
            disconnect();
            socket.emit('leave', NOTIFICATION_ROOM);
        }
    }
  }, [socket, initializeSocket, disconnect])

  return (
    <SocketCtx.Provider
      value={{
        socket,
        isConnected,
        connectionError,
        notifications,
        sendNotification,
        socketId,
        disconnect,
      }}
    >
      {children}
    </SocketCtx.Provider>
  )
}

