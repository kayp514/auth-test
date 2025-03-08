'use client'

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { generateKeyPair, setServerPublicKey, isEncryptionReady, decryptFromServer, encryptForServer } from "../utils/encryption"
import { encryptAndPackMessage, decryptAndUnpackMessage } from '../utils/binaryProtocol';
import { getStoredSessionId, storeSessionId } from "@/app/providers/utils/socketSessionConfig"
import { SocketAuthCtx, type SocketAuthCtxState } from "./SocketAuthCtx"
import type {  PresenceUpdate, Presence, SocketConfig } from "@/app/providers/utils/socket"


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

  const authenticate = async () => {
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

      if (!authResponse.ok) throw new Error('Authentication failed');
      
      const { sessionId, serverPublicKey } = await authResponse.json();
      setServerPublicKey(serverPublicKey);
      
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
      const clientPublicKey = generateKeyPair();
      
      const keysResponse = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          clientPublicKey
        })
      });

      if (!keysResponse.ok) throw new Error('Key exchange failed');
      
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

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if we already have a valid session
        const existingSessionId = await getStoredSessionId(config)

        if (existingSessionId) {
          setState((prev) => ({
            ...prev,
            sessionId: existingSessionId,
            connectionState: "ready_for_socket",
          }))
          return
        }

        // Start new authentication flow
        const { sessionId } = await authenticate()
        await exchangeKeys(sessionId)
      } catch (error) {
        console.error("Authentication process failed:", error)
      }
    }

    initAuth()
  }, [config])

  return (
    <SocketAuthCtx.Provider value={{ ...state, authenticate, exchangeKeys }}>
      {children}
    </SocketAuthCtx.Provider>
  );
};