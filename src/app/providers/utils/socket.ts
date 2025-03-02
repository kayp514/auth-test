

export type ChatStatus = 'sent' | 'delivered' | 'read'
export type MessageType = 'text' | 'image' | 'file'
export type UserStatus = 'online' | 'offline' | 'away' | 'busy' | 'dnd' | 'unknown'
export type MessageStatus = 'pending' | 'delivered' | 'sent' | 'error'
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
    'chat:private': (
      data: { targetId: string; message: string; metaData?: ClientMetaData },
      callback?: (response: { success: boolean; messageId?: string; error?: string }) => void
    ) => void;
    'chat:profile_update': (data: ClientAdditionalData) => void;
    'chat:confirm_receipt': (
      data: { messageId: string },
      callback?: (response: { received: boolean }) => void
    ) => void;
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