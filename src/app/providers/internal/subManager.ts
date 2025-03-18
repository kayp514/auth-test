import type { Socket } from 'socket.io-client';
import type { ChatMessage, MessageStatus, PresenceUpdate } from '@/app/providers/utils/socket';

export type EventHandler = (data: any) => void;

export class SubscriptionManager {
  private socket: Socket | null;
  private activeSubscriptions: Set<string>;
  private registerEventHandler: (event: string, handler: EventHandler) => () => void;

  constructor(
    socket: Socket | null, 
    registerEventHandler: (event: string, handler: EventHandler) => () => void
  ) {
    this.socket = socket;
    this.activeSubscriptions = new Set();
    this.registerEventHandler = registerEventHandler;
  }

  updateSocket(socket: Socket | null) {
    this.socket = socket;
  }

  subscribeToMessageStatus(callback: (messageId: string, status: MessageStatus) => void) {
    if (!this.socket) return () => {};

    this.socket.emit('chat:subscribe_status');
    this.activeSubscriptions.add('chat:status');

    // Use registerEventHandler from SocketWebSocketProvider
    const handleStatus = (data: { 
        messageId: string, 
        status: string,
        fromId?: string,
        success?: boolean,
        error?: string
      }) => {
        console.log('Received status update:', data);

      if (data.status === 'confirm_delivery' && data.fromId) {
        // Handle delivery confirmation request
        console.log('Acknowledging delivery for message:', data.messageId);
        this.socket?.emit('chat:status', {
          messageId: data.messageId,
          status: 'delivered_confirmed',
          fromId: data.fromId,
        });
        return;
      }

      let clientStatus: MessageStatus;
      switch (data.status) {
        case 'server_received':
          if (data.success) {
            clientStatus = 'sent';
          } else {
            clientStatus = 'error';
          }
          break;
        case 'sent':
          clientStatus = 'sent';
          break;
        case 'delivered':
          clientStatus = 'delivered';
          break;
        case 'error':
          clientStatus = 'error';
          break;
        default:
          clientStatus = 'pending';
      }

      callback(data.messageId, clientStatus);
    };

    const unregister = this.registerEventHandler('chat:status', handleStatus);

    return () => {
      if (this.socket) {
        this.socket.emit('chat:unsubscribe_status');
        unregister();
        this.activeSubscriptions.delete('chat:status');
      }
    };
  }

  subscribeToMessages(callback: (message: ChatMessage) => void) {
    if (!this.socket) return () => {};
    
    this.activeSubscriptions.add('chat:message');
    
    // Use registerEventHandler from SocketWebSocketProvider
    const handleMessage = (message: ChatMessage) => {
      if (!message?.messageId || !message?.roomId) {
        console.warn('Received invalid message format:', message);
        return;
      }
      callback(message);
    };

    const unregister = this.registerEventHandler('chat:message', handleMessage);

    return () => {
      unregister();
      this.activeSubscriptions.delete('chat:message');
    };
  }

  // Presence Subscriptions with registerEventHandler
  subscribeToPresence(callback: (data: PresenceUpdate) => void) {
    if (!this.socket) return () => {};

    this.socket.emit('presence:subscribe');
    this.activeSubscriptions.add('presence:subscribe');

    const handlePresence = (data: PresenceUpdate) => {
      callback(data);
    };

    const unregister = this.registerEventHandler('presence:update', handlePresence);

    return () => {
      if (this.socket) {
        this.socket.emit('presence:unsubscribe');
        unregister();
        this.activeSubscriptions.delete('presence:subscribe');
      }
    };
  }

  async handleRecovery() {
    if (!this.socket) return;

    const subscriptions = Array.from(this.activeSubscriptions);
    console.log('Recovering subscriptions:', subscriptions);

    try {
      await Promise.all(subscriptions.map(sub => {
        switch(sub) {
          case 'presence:subscribe':
            return this.socket?.emit('presence:subscribe');
          case 'chat:status':
            return this.socket?.emit('chat:subscribe_status');
          case 'chat:message':
            return Promise.resolve(); // Messages auto-subscribe
          default:
            console.warn(`Unknown subscription type: ${sub}`);
            return Promise.resolve();
        }
      }));

      console.log('Successfully recovered subscriptions');
    } catch (error) {
      console.error('Error recovering subscriptions:', error);
    }
  }

  getActiveSubscriptions() {
    return Array.from(this.activeSubscriptions);
  }
}