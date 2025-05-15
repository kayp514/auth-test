'use client'

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { generateKeyPair, 
  setServerPublicKey,
   isEncryptionReady, 
   decryptFromServer, encryptForServer 
} from "../utils/encryption"
import { encryptAndPackMessage, decryptAndUnpackMessage } from '../utils/binaryProtocol';
import { getStoredSessionId, storeSessionId, storeKeys, getStoredKeys, clearStoredSessionKeys } from "@/app/providers/utils/socketSessionConfig"
import { SocketAuthCtx, type SocketAuthCtxState } from "./SocketAuthCtx"
import type {  PresenceUpdate, Presence, SocketConfig } from "@/app/providers/utils/socket"
import { toast } from "sonner"


interface SocketAuthProviderProps {
    children: ReactNode
    config: SocketConfig
  }

export const SocketAuthProvider = ({ children, config }: SocketAuthProviderProps) => {
  const [state, setState] = useState<SocketAuthCtxState>({
    connectionState: 'idle',
    sessionId: null,
    authError: null,
    keyExchangeError: null
  });

  const authInProgress = useRef(false)
  const configRef = useRef(config)

  const authenticate = async () => {
    if (authInProgress.current) return null

    authInProgress.current = true
    setState(prev => ({ ...prev, connectionState: 'authenticating' }));
    
    try {
      const authResponse = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: config.clientId,
          apiKey: config.apiKey
        })
      });

      if (!authResponse.ok) {
        toast.error("Authentication Failed", {
          description: "Failed to authenticate. Please check your credentials and try again.",
          duration: 5000,
        });
        throw new Error('Authentication failed');
      }
      
      const { sessionId, serverPublicKey } = await authResponse.json();

      //setServerPublicKey(serverPublicKey, sessionId);

      await storeKeys({
        publicKey: '',
        secretKey: '',
        serverPublicKey
      });
      
      setState(prev => ({ 
        ...prev, 
        sessionId,
        connectionState: 'exchanging_keys'
      }));

      return { sessionId, serverPublicKey };
    } catch (error) {
      setState(prev => ({
        ...prev,
        connectionState: 'error',
        authError: 'Authentication failed'
      }));
      throw error;
    }
  };

  const exchangeKeys = async (sessionId: string) => {
    try {
     const { publicKey, secretKey} = generateKeyPair();
      
      const keysResponse = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          clientPublicKey: publicKey
        })
      });

      if (!keysResponse.ok) throw new Error('Key exchange failed');

      const storedKeys = getStoredKeys();
      if (!storedKeys?.serverPublicKey) {
        throw new Error('Server public key not found');
      }

      await storeKeys({
        publicKey: publicKey, 
        secretKey: secretKey,
        serverPublicKey: storedKeys.serverPublicKey
      });
      
      storeSessionId(sessionId, config);
      
      setState(prev => ({ 
        ...prev,
        connectionState: 'ready_for_socket'
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        connectionState: 'error',
        keyExchangeError: 'Key exchange failed'
      }));
      throw error;
    }
  };

  const reAuthenticate = async () => {
    // Clear stored session and keys
    await clearStoredSessionKeys()
    
    setState(prev => ({
      ...prev,
      sessionId: null,
      connectionState: 'authenticating' // Show authenticating state
    }));

    try {
      // Start new authentication flow
      const result = await authenticate();
      if (result?.sessionId) {
        await exchangeKeys(result.sessionId);
      }
    } catch (error) {
      console.error('Re-authentication failed:', error);
      setState(prev => ({
        ...prev,
        connectionState: 'error',
        authError: 'Re-authentication failed'
      }));
      throw error;
    }
  };

  useEffect(() => {
    if (
      configRef.current.clientId === config.clientId &&
      configRef.current.apiKey === config.apiKey &&
      state.connectionState !== "idle"
    ) {
      console.log("Skipping authentication, already in progress or completed")
      return
    }

    configRef.current = config

    const initAuth = async () => {
      try {
        // Check if we already have a valid session
        const existingSessionId = getStoredSessionId(config) //removed await

        if (existingSessionId) {
          setState((prev) => ({
            ...prev,
            sessionId: existingSessionId,
            connectionState: "ready_for_socket",
          }))
          return
        }

        // Start new authentication flow
        const result = await authenticate()
        if (result && result.sessionId) {
          await exchangeKeys(result.sessionId)
        }
      } catch (error) {
        console.error("Authentication process failed:", error)

        toast.error("Authentication Failed", {
          description: "Failed to authenticate.",
          duration: 5000,
        });
      }
    }

    initAuth()

    return () => {
      console.log("SocketAuthProvider unmounting")
      authInProgress.current = false
    }
  }, [config])

  return (
    <SocketAuthCtx.Provider value={{
       ...state,
       authenticate,
       exchangeKeys,
       reAuthenticate
      }}
      >
      {children}
    </SocketAuthCtx.Provider>
  );
};