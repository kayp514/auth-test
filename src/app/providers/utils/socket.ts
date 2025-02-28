import type { User } from '@/lib/db/types'

export type ChatStatus = 'sent' | 'delivered' | 'read'
export type MessageType = 'text' | 'image' | 'file'
export type UserStatus = 'online' | 'offline' | 'away' | 'busy' | 'dnd' | 'unknown'
export type MessageStatus = 'pending' | 'delivered' | 'error'
export type NotificationType = 'info' | 'success' | 'warning' | 'error'
export type StorageType = 'localStorage' | 'sessionStorage' | 'none';

export interface Presence {
  status: UserStatus
  customMessage?: string
}


export interface Notification {
  id: string
  type: NotificationType
  message: string
  timestamp: string
  data?: Record<string, unknown>
}

export interface PresenceUpdate {
  clientId: string
  presence: {
    status: UserStatus
    customMessage?: string
    lastUpdated: string
    socketId: string
  }
}

export interface ClientAdditionalData {
  name?: string | null
  email?: string | null
  avatar?: string | null
}

export interface ClientMetaData {
  name?: string | null
  email?: string | null
  avatar?: string | null
}


export interface StatusUpdate {
    userId: string;
    status: UserStatus;
    timestamp: number;
}
  
  export interface ServerToClientEvents {
    statusUpdate: (update: StatusUpdate) => void;
    userConnected: (userId: string) => void;
    userDisconnected: (userId: string) => void;
  }
  
  export interface ClientToServerEvents {
    'chat:private': (data: { targetId: string; message: string; metaData?: ClientMetaData }) => void;
    //'chat:typing': (data: { targetId: string; isTyping: boolean }) => void;
    'chat:profile_update': (data: ClientAdditionalData) => void;
    
    //'presence:update': (status: string) => void;
    'presence:update': (presence: Presence) => void;
  }

  export interface InterServerEvents {
    ping: () => void
  }
  

  export interface SocketData {
    clientId: string
    apiKey: string
  }
  
export interface ChatMessage {
  messageId: string;
  roomId: string;
  message: string;
  fromId: string;
  toId: string;
  timestamp: string;
  metaData?: ClientMetaData;
  toData?: ClientMetaData;
}

export interface ChatError {
    messageId?: string;
    message: string;
}


export interface SocketConfig {
  clientId: string;
  apiKey: string;
  storageType?: StorageType;
  storageKey?: string;
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