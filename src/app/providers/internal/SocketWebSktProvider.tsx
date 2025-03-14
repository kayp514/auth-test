'use client'

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { toast } from "sonner"
import { io, type Socket } from "socket.io-client"
import { v4 as uuidv4 } from 'uuid'
import { 
  SocketWebSktCtx,
  EventHandler, 
  type SocketWebSktCtxState,
} from "./SocketWebSktCtx"

import { useSocketAuth } from "./SocketAuthCtx"

import type {  PresenceUpdate, Presence, SocketConfig } from "@/app/providers/utils/socket"
import { getStoredSessionId } from "@/app/providers/utils/socketSessionConfig"
import { 
  isEncryptionReady, 
  decryptFromServer, encryptForServer
 } from "../utils/encryption"



// Constants
const SOCKET_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_SOCKET_URL,
  room: 'notifications',
  reconnection: true,
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
  const { reAuthenticate } = useSocketAuth();
  const eventHandlersRef = useRef<Record<string, EventHandler[]>>({});
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

  const registerEventHandler = useCallback((eventName: string, handler: EventHandler) => {
    if (!eventHandlersRef.current[eventName]) {
      eventHandlersRef.current[eventName] = [];
    }

    eventHandlersRef.current[eventName].push(handler);
    
    // Return a function to unregister the handler
    return () => {
      if (eventHandlersRef.current[eventName]) {
        eventHandlersRef.current[eventName] = eventHandlersRef.current[eventName].filter(h => h !== handler);
        if (eventHandlersRef.current[eventName].length === 0) {
          delete eventHandlersRef.current[eventName];
        }
      }
    };
  }, []);

  const triggerEventHandlers = useCallback((eventName: string, data: any) => {
    if (eventHandlersRef.current[eventName]) {
      eventHandlersRef.current[eventName].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${eventName}:`, error);
        }
      });
      return true; // Handlers were found and triggered
    }
    return false; // No handlers found
  }, []);

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
    

    const setPresence = useCallback((presence: Presence) => {
      console.log('Setting presence:', { clientId: config.clientId, presence });
      if (state.socket && state.isConnected) {
        const presenceData = {
          status: presence.status,
          customMessage: presence.customMessage || ''
        };
        state.socket.emit('presence:update', presence);
      } else {
        console.warn('Cannot set presence - socket not connected');
      }
    }, [state.socket, state.isConnected, config.clientId]);


  const setupSocketHandlers = useCallback((
    socketInstance: Socket,
    reAuth: () => Promise<void>
  ) => {
    const originalEmit = socketInstance.emit;
    
    socketInstance.emit = function(event: string, ...args: any[]): Socket {
      const lastArg = args[args.length - 1];
      const hasCallback = typeof lastArg === 'function';

      let callback: Function | undefined;
      if (hasCallback) {
        callback = args.pop() as Function;
      }

      const payload = args[0];

      if (isEncryptionReady()) {
        try {
          const messageData = { 
            event, 
            data: payload,
            expectsAck: hasCallback // Add this flag
          };

          const messageString = JSON.stringify(messageData);
          console.log('Sending encrypted message:', { event, payload, expectsAck: hasCallback });
          
          const encryptedBase64 = encryptForServer(messageString);
          if (encryptedBase64) {
            console.log('Message encrypted successfully');
            const binaryString = atob(encryptedBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            //originalEmit.call(this, 'binary', bytes.buffer, true);
           // return this;
           if (hasCallback && callback) {
            // If we have a callback, we need to handle the acknowledgment
            originalEmit.call(this, 'binary', bytes.buffer, true, (response: any) => {
              console.log('Received acknowledgment for encrypted message:', response);
              if (callback) callback(response);
            });
          } else {
            // No callback
            originalEmit.call(this, 'binary', bytes.buffer, true);
          }
          return this;
        }
        } catch (error) {
          console.error('Encryption error:', error);
        }
      }

      // Fallback to unencrypted
      if (hasCallback && callback) {
        originalEmit.call(this, event, payload, callback);
      } else {
        originalEmit.call(this, event, payload);
      }
      return this;
    };
    // Basic connection handlers
    socketInstance.on("connect", () => {
      console.log("Socket connected with ID:", socketInstance.id);

      if (socketInstance.recovered) {
        console.log("Socket connection recovered with previous state");
        toast.success("Connection Recovered", {
          description: "Connection restored with all missed events synchronized.",
          duration: 3000,
        });
      } else if (!state.isConnected) {
        // Only show regular connection toast if it was previously disconnected
        toast.success("Connected", {
          description: "Socket connection established successfully.",
          duration: 3000,
        });
      }

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
      if (error.message.includes('Invalid session ID')) {
        reAuth()
      }

      toast.error("Connection error", {
        description: "Failed to initialize socket connection. Please try again later.",
        duration: 5000,
      })

      setState(prev => ({
        ...prev,
        connectionError: error.message,
        isConnected: false,
        socketId: null
      }));
    });

    
    // Binary message handler
    socketInstance.on('binary', (data: ArrayBuffer, isEncrypted: boolean) => {
      console.log('Received binary message:', { isEncrypted, dataSize: data.byteLength });
      try {
        //const decryptedData = decryptAndUnpackMessage(config.clientId, data);
        if (isEncrypted &&  isEncryptionReady()) {
          const decryptedMessage = decryptFromServer(btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(data)))
        ));
        
        if (decryptedMessage) {
          const { event, data: messageData } = decryptedMessage;
          console.log(`Received encrypted ${event} event:`, messageData);

          const handled = triggerEventHandlers(event, messageData);
  
          // Handle different event types
          if (!handled) {
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
      } else {
        console.warn('Failed to decrypt binary message')
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
  }, [config.clientId, handlePresenceSync, handlePresenceLeave, handlePresenceEnter, isEncryptionReady, triggerEventHandlers]);
  

  // Initialize connection on mount
  useEffect(() => {
    if (connectionAttempted.current) return;
    
    connectionAttempted.current = true;

    const sessionId = getStoredSessionId(config);

    if (!sessionId) {
      setState(prev => ({
        ...prev,
        connectionError: 'No session ID found. Please authenticate first.'
      }));
      
      toast.error("Authentication Required", {
        description: "No session ID found. Please authenticate first.",
        duration: 5000,
      });
      return;
    }

    const socketInstance = createSocketInstance({ 
      config,
      sessionId
    });

    setupSocketHandlers(socketInstance, reAuthenticate);

    setState(prev => ({ 
      ...prev, 
      socket: socketInstance,
      sessionId
    }));
  }, [config, reAuthenticate, setupSocketHandlers]);


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



  return (
    <SocketWebSktCtx.Provider
      value={{
        ...state,
        sendNotification,
        disconnect,
        clearNotifications,
        setPresence,
        registerEventHandler,
      }}
    >
      {children}
    </SocketWebSktCtx.Provider>
  )
}