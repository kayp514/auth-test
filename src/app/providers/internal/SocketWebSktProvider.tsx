'use client'

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { toast } from "sonner"
import { io, type Socket } from "socket.io-client"
import { v4 as uuidv4 } from 'uuid'
import { 
  SocketWebSktCtx, 
  type SocketWebSktCtxState,
} from "./SocketWebSktCtx"

import type {  PresenceUpdate, Presence, SocketConfig } from "@/app/providers/utils/socket"
import { getStoredSessionId, storeSessionId } from "@/app/providers/utils/socketSessionConfig"
import { generateKeyPair, setServerPublicKey, isEncryptionReady, decryptFromServer, encryptForServer } from "../utils/encryption"
import { encryptAndPackMessage, decryptAndUnpackMessage } from '../utils/binaryProtocol';



// Constants
const SOCKET_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_SOCKET_URL,
  room: 'notifications',
  reconnectionAttempts: 5,
  reconnectionDelay: 10000,
  reconnectionDelayMax: 5000,
  connectionTimeout: 60000,
} as const

// Types
interface SocketWebSktProviderProps {
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
    reconnectionDelayMax: SOCKET_CONFIG.reconnectionDelayMax,
    timeout: SOCKET_CONFIG.connectionTimeout,
    autoConnect: true,
    auth: {
      clientId: config.clientId,
      apiKey: config.apiKey,
      sessionId
    }
  })
}

export function SocketWebSktProvider({ children, config }: SocketWebSktProviderProps) {

  const initialSessionId = useRef(getStoredSessionId(config));

  const [state, setState] = useState<SocketWebSktCtxState>({
    socket: null,
    isConnected: false,
    connectionError: null,
    notifications: [],
    socketId: null,
    presenceState: new Map(),
    clientId: config.clientId,
    sessionId: null
  })
  
  const connectionAttempted = useRef(false)
  const configRef = useRef(config)



  const setupSocketHandlers = useCallback((socketInstance: Socket) => {
    // Basic connection handlers
    socketInstance.on("connect", () => {
      console.log("Socket connected with ID:", socketInstance.id);
      setState(prev => ({
        ...prev,
        isConnected: true,
        connectionError: null,
        socketId: socketInstance.id ?? null
      }));
    });
  
    socketInstance.on("disconnect", (reason: string) => {
      console.log("Socket disconnected:", reason);
      setState(prev => ({
        ...prev,
        isConnected: false,
        socketId: null
      }));
    });
  
    socketInstance.on("connect_error", (error: Error) => {
      console.error("Socket connection error:", error);
      setState(prev => ({
        ...prev,
        connectionError: error.message,
        isConnected: false,
        socketId: null
      }));
    });
  
    // Binary message handler
    socketInstance.on('binary', (data: ArrayBuffer) => {
      try {
        const decryptedData = decryptAndUnpackMessage(config.clientId, data);
        if (decryptedData) {
          const { event, data: messageData } = decryptedData;
          console.log(`Received encrypted ${event} event`);
  
          // Handle different event types
          switch(event) {
            case 'presence:enter':
              handlePresenceEnter(messageData);
              break;
            case 'presence:update':
              handlePresenceUpdate(messageData);
              break;
            case 'presence:sync':
              handlePresenceSync(messageData);
              break;
            case 'presence:leave':
              handlePresenceLeave(messageData);
              break;
            case 'notification':
              handleNotification(messageData);
              break;
            default:
              console.log(`Unhandled event type: ${event}`);
          }
        }
      } catch (error) {
        console.error('Error processing binary message:', error);
      }
    });
  
    // Cleanup function
    return () => {
      socketInstance.off("connect");
      socketInstance.off("disconnect");
      socketInstance.off("connect_error");
      socketInstance.off("binary");
    };
  }, [config.clientId]);
  
  // Event handlers
  const handlePresenceEnter = useCallback((data: PresenceUpdate) => {
    if (data.clientId === config.clientId) return;
    setState(prev => ({
      ...prev,
      presenceState: new Map(prev.presenceState).set(data.clientId, data)
    }));
  }, [config.clientId]);
  
  const handlePresenceUpdate = useCallback((data: PresenceUpdate) => {
    setState(prev => ({
      ...prev,
      presenceState: new Map(prev.presenceState).set(data.clientId, data)
    }));
  }, []);
  
  const handlePresenceSync = useCallback((updates: PresenceUpdate[]) => {
    setState(prev => {
      const newPresenceState = new Map();
      updates.forEach(update => {
        newPresenceState.set(update.clientId, update);
      });
      return { ...prev, presenceState: newPresenceState };
    });
  }, []);
  
  const handlePresenceLeave = useCallback(({ clientId }: { clientId: string }) => {
    setState(prev => {
      const newPresenceState = new Map(prev.presenceState);
      newPresenceState.delete(clientId);
      return { ...prev, presenceState: newPresenceState };
    });
  }, []);
  
  const handleNotification = useCallback((notification: Notification) => {
    setState(prev => ({
      ...prev,
      notifications: [...prev.notifications, notification]
    }));
  }, []);


  // Initialize connection on mount
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const initializeSocket = async () => {
      try {
        const sessionId = await getStoredSessionId(config);

        if (!sessionId) {
          setState(prev => ({
            ...prev,
            connectionError: 'No session ID found. Please authenticate first.'
          }));
          return;
        }

        const socketInstance = createSocketInstance({ 
          config,
          sessionId: initialSessionId.current 
        })

        cleanup = setupSocketHandlers(socketInstance);

        setState(prev => ({ 
          ...prev, 
          socket: socketInstance,
          sessionId
        }));

      } catch (error) {
        console.error('Socket connection error:', error);
        setState(prev => ({
          ...prev,
          connectionError: error instanceof Error ? error.message : 'Failed to connect'
        }));
      }
    };

    initializeSocket();

    return () => {
      cleanup?.();
      state.socket?.disconnect();
      connectionAttempted.current = false;
    };
  }, [config])


  // Event Handlers
{/*  const createEventHandlers = useCallback((socketInstance: Socket): SocketEventHandlers => ({
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

  }), []) */}

  // Socket initialization
{/*  useEffect(() => {
    if (connectionAttempted.current) return

    connectionAttempted.current = true


    try {
      const socketInstance = createSocketInstance({ 
        config,
        sessionId: initialSessionId.current 
      })
      const handlers = createEventHandlers(socketInstance)

      socketInstance.on("session", (data) => {
        handlers.onSession(data)


        if (data.serverPublicKey) {
          console.log("Received server public key, setting up encryption");
          setServerPublicKey(data.serverPublicKey)

          const clientPublicKey = generateKeyPair()
          socketInstance.emit('client:publicKey', clientPublicKey)

          console.log('Sent client public key to server')
        } else {
          console.warn('No server public key recieved, encrytion not available');
        }
      })

      socketInstance.on('encrypted', (packet) => {
        const { event, data } = packet

        if (isEncryptionReady()) {
          try {
          const decryptedData = decryptFromServer(data)
          if (decryptedData) {
            console.log(`Received encrypted ${event} event`);

            switch(event) {
              case 'presence:enter': handlers.onPresenceEnter(decryptedData); break;
              case 'presence:update': handlers.onPresenceUpdate(decryptedData); break;
              case 'presence:sync': handlers.onPresenceSync(decryptedData); break;
              case 'presence:leave': handlers.onPresenceLeave(decryptedData); break;
              case 'recent_notification': handlers.onRecentNotification(decryptedData); break;
              case 'notification': handlers.onNotification(decryptedData); break;
              default: console.log(`unhandled encrypted event type: ${event}`);
            }
          } else {
            console.error('Failed to decrypt message');
          }
        } catch (error) {
          console.error('Error processing encrypted message:', error)
        }
      }
      })

      socketInstance.on('encryption:ready', () => {
        console.log('Encryption is ready for use');
        // You might want to set a state variable to track this
        setState(prev => ({
          ...prev,
          encryptionReady: true
        }));
      });

      // Attach event listeners
      socketInstance.on("connect", handlers.onConnect)
      socketInstance.on("disconnect", handlers.onDisconnect)
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
        socketInstance.off("session")
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
      //console.error("Socket initialization error:", error)

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
  }, [createEventHandlers]) */}

{/*  useEffect(() => {
    if (!state.socket) return;

    const socketInstance = createSocketInstance({ 
      config,
      sessionId: initialSessionId.current 
    })

    const handlers = createEventHandlers(socketInstance)
    
    // Get access to the raw WebSocket
    const rawSocket = (state.socket as any).io.engine.transport.ws;
    
    
    if (rawSocket) {
      // Listen for binary messages
      rawSocket.addEventListener('message', (event: MessageEvent) => {
        if (event.data instanceof ArrayBuffer) {
          const message = decryptAndUnpackMessage(config.clientId,event.data);
          if (message) {
            const { event: eventName, data } = message;
            console.log(`Received encrypted binary message for event: ${eventName}`);
            
            // Handle the event based on its type
            switch(eventName) {
              case 'presence:enter': 
                handlers.onPresenceEnter(data); 
                break;
              case 'presence:update': 
                handlers.onPresenceUpdate(data); 
                break;
              case 'presence:sync': 
                handlers.onPresenceSync(data); 
                break;
              case 'presence:leave': 
                handlers.onPresenceLeave(data); 
                break;
              case 'recent_notification': 
                handlers.onRecentNotification(data); 
                break;
              case 'notification': 
                handlers.onNotification(data); 
                break;
            }
          }
        }
      });
    }
    
    // Override the emit method to send binary messages
    const originalEmit = state.socket.emit;
    state.socket.emit = function(event, ...args) {
      // Skip encryption for certain events
      if (['session', 'client:publicKey', 'encryption:ready'].includes(event)) {
        return originalEmit.apply(this, [event, ...args]);
      }
      
      if (isEncryptionReady() && rawSocket && rawSocket.readyState === WebSocket.OPEN) {
        const payload = args[0];
        const binaryData = encryptAndPackMessage(event, payload);
        
        if (binaryData) {
          console.log(`Sending encrypted binary message for event: ${event}`);
          rawSocket.send(binaryData);
          return;
        }
      }
      
      // Fallback to regular Socket.IO
      return originalEmit.apply(this, [event, ...args]);
    };
  }, [state.socket, createEventHandlers]); */}
  



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

  //const isAuthenticating = state.connectionState === 'authenticating';
  //const isExchangingKeys = state.connectionState === 'exchanging_keys';
  //const isConnectingSocket = state.connectionState === 'connecting_socket';
  //const isFullyConnected = state.connectionState === 'connected';


  return (
    <SocketWebSktCtx.Provider
      value={{
        ...state,
        sendNotification,
        disconnect,
        clearNotifications,
        setPresence,
      }}
    >
      {children}
    </SocketWebSktCtx.Provider>
  )
}