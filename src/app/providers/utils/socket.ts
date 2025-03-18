

export type ChatStatus = 'sent' | 'delivered' | 'read'
export type MessageType = 'text' | 'image' | 'file'
export type UserStatus = 'online' | 'offline' | 'away' | 'busy' | 'dnd' | 'unknown'
export type MessageStatus = 'pending' | 'delivered' | 'sent' | 'received' | 'error'
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
      data: { targetId: string; message: string; metaData?: ClientMetaData; toData?: ClientMetaData },
      callback?: (response: { success: boolean; messageId?: string; error?: string }) => void
    ) => void;
    'chat:profile_update': (data: ClientAdditionalData) => void;
    //'chat:confirm_receipt': (data: { messageId: string }, callback?: (response: { received: boolean }) => void) => void;

    'chat:status': (data: { messageId: string; status: string; fromId?: string}, callback?: (response: { received: boolean }) => void) => void;
    'chat:subscribe_status': () => void;
    'chat:unsubscribe_status': () => void;
    'chat:messages': (options: { requestId: string; roomId: string; limit?: number; before?: string; after?: string }, callback?: (response: { success: boolean; messages?: ChatMessage[]; error?: string }) => void) => void;
    'chat:conversations': (options: { requestId: string; limit?: number; offset?: number }, callback?: (response: { success: boolean; conversations?: any[]; hasMore?: boolean; error?: string }) => void) => void;

    'presence:update': (presence: Presence) => void;

    'client:publicKey': (publicKey: string) => void;
    'encrypted': (data: { event: string; data: string }) => void;

    'binary': (data: ArrayBuffer, isEncrypted: boolean) => void;
  }

  export interface InterServerEvents {
    ping: () => void
  }
  

  export interface SocketData {
    clientId: string
    apiKey: string
  }

  export interface ClientMetaData {
    uid: string | undefined
    name?: string | null
    email?: string | null
    avatar?: string | null
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

export interface ConversationData {
  roomId: string;
  otherUserId: string;
  lastMessage: ChatMessage;
  unreadCount: number;
  lastActivity: number;
}

export interface ChatError {
    messageId?: string;
    error: string;
}


export interface SocketConfig {
  clientId: string;
  apiKey: string;
  storageType?: StorageType;
  storageKey?: string;
}