import type { StorageType, SocketConfig } from "./socket";

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