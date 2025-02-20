

export type ChatStatus = 'sent' | 'delivered' | 'read';
export type MessageType = 'text' | 'image' | 'file';
export type UserStatus = 'online' | 'offline' | 'away' | 'busy' | 'dnd' | 'unknown';

export interface PresenceUpdate {
  userId: string
  presence: {
    status: UserStatus
    customMessage?: string
    lastUpdated: string
    socketId: string
  }
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
    setStatus: (status: UserStatus) => void;
    initialize: (userId: string) => void;
  }

  export interface InterServerEvents {
    ping: () => void
  }
  
  export interface SocketData {
    userId: string
    status: UserStatus
  }