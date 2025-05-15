import type { StorageType, SocketConfig } from "./socket";

export const STORAGE_KEY = 'secure_keys'

interface SessionKeys {
  publicKey: string  | null;
  secretKey: string | null;
  serverPublicKey: string | null;
}

export const createSocketConfig = (
    clientId: string,
    apiKey: string,
    options?: {
      storageType?: StorageType;
      storageKey?: string;
    }
  ): SocketConfig => {
    return {
      clientId,
      apiKey,
      storageType: options?.storageType || 'sessionStorage',
      storageKey: options?.storageKey || 'socket_session_id'
    };
  };
  
  
  
  export const getStoredSessionId = (config: SocketConfig): string | null => {
    if (typeof window === 'undefined' || config.storageType === 'none') {
      return null;
    }
    
    const storage = config.storageType === 'localStorage' 
      ? localStorage 
      : sessionStorage;
      
    return storage.getItem(config.storageKey || 'socket_session_id');
  };
  
  export const storeSessionId = (sessionId: string, config: SocketConfig): void => {
    if (typeof window === 'undefined' || config.storageType === 'none') {
      return;
    }
    
    const storage = config.storageType === 'localStorage' 
      ? localStorage 
      : sessionStorage;
      
    storage.setItem(config.storageKey || 'socket_session_id', sessionId);
  };


  export const storeKeys = async(keys: {
    publicKey: string; 
    secretKey: string; 
    serverPublicKey: string;
  }): Promise<void> => {

    try {
      const session: SessionKeys = {
        publicKey: keys.publicKey || null,
        secretKey: keys.secretKey || null,
        serverPublicKey: keys.serverPublicKey || null
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } catch (error) {
      console.error('Error storing session:', error)
    }
  };


export const getStoredKeys = (): SessionKeys | null => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) return null;

    const session: SessionKeys = JSON.parse(storedData);
    return session;
  } catch (error) {
    console.error('Error retrieving stored keys:', error);
    return null;
  }
};


  export const clearStoredSessionKeys = (): void => {
    localStorage.removeItem('app_socket_session')
    localStorage.removeItem(STORAGE_KEY)
  }