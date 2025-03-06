'use client'

import { useState, useCallback, useRef} from 'react'
import { useSocket } from './SocketCtx'
import { ChatCtx } from './ChatCtx'
import type { 
  ChatMessage, 
  ChatError, 
  ClientAdditionalData, 
  ClientMetaData, 
  MessageStatus,
  ConversationData
 } from "@/app/providers/utils/socket"

 

interface ChatProviderProps {
  children: React.ReactNode
  clientAdditionalData?: ClientAdditionalData
  clientMetaData?: ClientMetaData,
  onMessageSent?: (message: ChatMessage) => void
  onMessageReceived?: (message: ChatMessage) => void
  onMessageDelivered?: (messageId: string) => void
  onMessageError?: (error: ChatError) => void
  onTypingStatusChange?: (userId: string, isTyping: boolean) => void
  onProfileUpdated?: () => void
}

interface PendingMessage {
  message: ChatMessage
  attempts: number
  timestamp: number
}


export function ChatProvider({ 
  children,
  clientAdditionalData,
  clientMetaData,
  onMessageSent,
  onMessageReceived,
  onMessageDelivered,
  onMessageError,
  onTypingStatusChange,
  onProfileUpdated
}: ChatProviderProps) {
  const { socket, isConnected, clientId } = useSocket()
  const [selectedUser, setSelectedUser] = useState<ClientMetaData | null>(null)
  const [localUserData, setLocalUserData] = useState<Record<string, ClientMetaData>>({})
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({})
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({})
  const [pendingMessages, setPendingMessages] = useState<Record<string, PendingMessage>>({})
  const [deliveryStatus, setDeliveryStatus] = useState<Record<string, MessageStatus>>({})
  const currentUserId = clientId
  const messagesRef = useRef<Record<string, ChatMessage[]>>({})
  const knownUsersRef = useRef<Record<string, ClientMetaData>>({})
  const chatUsersRef = useRef<Map<string, ClientMetaData>>(new Map())
  const lastMessagesRef = useRef<Map<string, ChatMessage>>(new Map())
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [userListVersion, setUserListVersion] = useState(0)


  const subscribeToMessages = useCallback((
    callback: (message: ChatMessage) => void
  ) => {
    if (!socket) return () => {};

    const handleMessage = (message: ChatMessage) => {
      
      // Update messages state
      setMessages(prev => {
        const roomId = message.roomId;
        const existingMessages = prev[roomId] || [];
        
        // Check if we already have this message
        if (existingMessages.some(m => m.messageId === message.messageId)) {
          return prev;
        }
        
        // Add the new message
        const updatedMessages = [...existingMessages, message].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        return {
          ...prev,
          [roomId]: updatedMessages
        };
      });
      
      // Update last message reference
      const [user1, user2] = message.roomId.split('_');
      const recipientId = user1 === message.fromId ? user2 : user1;

      // Update last message reference for both users
      lastMessagesRef.current.set(message.fromId, message);
      lastMessagesRef.current.set(recipientId, message);

      callback(message);
    };
  
    socket.on('chat:message', handleMessage)
  
    return () => {
      socket.off('chat:message', handleMessage)
    }
  }, [socket])

  const subscribeToErrors = useCallback((
    callback: (error: ChatError) => void
  ) => {
    if (!socket) return () => {}
  
    socket.on('chat:error', callback)
  
    return () => {
      socket.off('chat:error', callback)
    }
  }, [socket])
  
  
  const subscribeToMessageStatus = useCallback((
    callback: (messageId: string, status: string) => void
  ) => {
    if (!socket) return () => {}
  
    socket.emit('chat:subscribe_status');
  
    const handleStatus = (data: { messageId: string, status: string }) => {
      console.log('Received status update:', data);
  
      let clientStatus: MessageStatus;
  
      switch (data.status) {
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
    }

    const handleDeliveryConfirmation = (
      data: { messageId: string, status: string },
      ack: (response: { received: boolean }) => void
    ) => {
      console.log('Received delivery confirmation request:', data);
      
      if (data.status === 'confirm_delivery') {
        // Immediately acknowledge receipt
        ack({ received: true });
        console.log('Acknowledged delivery for message:', data.messageId);
      }
    };
  
    socket.on('chat:status', handleStatus);
    socket.on('chat:status', handleDeliveryConfirmation);
  
    return () => {
      socket.emit('chat:unsubscribe_status');
      socket.off('chat:status', handleStatus);
      socket.off('chat:status', handleDeliveryConfirmation);
    }
  }, [socket]);


  const getRoomId = useCallback((userId: string): string => {
    return [currentUserId, userId].sort().join('_')
  }, [currentUserId])


  const sendMessage = useCallback(async (
    content: string,
    recipientId: string,
    recipientData?: ClientMetaData
  ): Promise<string> => {
    if (!socket || !isConnected) {
      throw new Error('Socket not connected')
    }

    const metaData = clientMetaData || {
      uid: currentUserId,
      name: currentUserId.substring(0, 8),
      email:  `${currentUserId}@example.com`,
    };

    const toData = recipientData || {
      uid: recipientId,
      name: recipientId.substring(0, 8),
      email: `${recipientId}@example.com`,
    }



    try {
      return new Promise<string>((resolve, reject) => {
        socket.emit('chat:private', {
        targetId: recipientId,
        message: content,
        metaData,
        toData
      }, (response: { 
        success: boolean; 
        messageId?: string; 
        error?: string
      }
      ) => {
        if(response.success && response.messageId) {
          resolve(response.messageId);
        } else {
          reject(new Error(response.error || 'Failed to send message'));
        }
      });
    });
    } catch (error) {
      console.error('Error sending message:', error)

      throw error
    }
  }, [socket, isConnected, currentUserId, clientMetaData])

  const setTypingStatus = useCallback((isTyping: boolean, recipientId: string) => {
    //if (!socket || !isConnected) return

    //socket.emit('chat:typing', {
     // targetId: recipientId,
      //isTyping
    //})
  }, [socket, isConnected])

  const getConversations = useCallback(async (options?: {
    limit?: number;
    offset?: number;
  }): Promise<{
    conversations: ConversationData[];
    hasMore: boolean;
  }> => {


    setLoadingConversations(true)

    try {
      return new Promise<{conversations: ConversationData[], hasMore: boolean}>((resolve, reject) => {
       socket?.emit('chat:conversations', {
        limit: options?.limit || 50,
        offset: options?.offset || 0
       }, (response: {
        success: boolean;
        conversations?: any[];
        hasMore?: boolean;
        error?: string;
       }) => {
        setLoadingConversations(false)

        if(response && response.success) {

          const conversations = response.conversations || [];
            conversations.forEach(conv => {
              if (conv.lastMessage) {
                lastMessagesRef.current.set(conv.otherUserId, conv.lastMessage);
              }
          });
      
          resolve({
            conversations: conversations,
            hasMore: response.hasMore || false,
          })
        } else {
          reject(new Error((response && response.error) || 'Failed to load conversations'))
        }
       })
      })
    } catch (error) {
      setLoadingConversations(false)
      console.error('Error laoding conversations:', error)
      throw error
    }
  }, [socket, isConnected])

  const getLastMessage = useCallback((userId: string): ChatMessage | undefined => {
    return lastMessagesRef.current.get(userId);
  }, [])

  const getMessages = useCallback(async (
    roomId: string,
    options?: {
      limit?: number;
      before?: string;
      after?: string;
    }
  ): Promise<ChatMessage[]> => {

    return new Promise<ChatMessage[]>((resolve, reject) => {
      socket?.emit('chat:messages', {
        roomId,
        limit: options?.limit || 50,
        before: options?.before,
        after: options?.after
      }, (response: {
        success: boolean;
        messages?: ChatMessage[];
        error?: string;
      }) => {
        if (response && response.success) {
          const messages = response.messages || [];

          if(!messagesRef.current[roomId]) {
            messagesRef.current[roomId] = [];
          }
          const existingIds = new Set(messagesRef.current[roomId].map(m => m.messageId));
          const newMessages = messages.filter(m => !existingIds.has(m.messageId));
          
          messagesRef.current[roomId] = [
            ...messagesRef.current[roomId],
            ...newMessages
          ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          
          // Update messages state
          setMessages(prev => ({
            ...prev,
            [roomId]: messagesRef.current[roomId]
          }));
          
          resolve(messages);
        } else {
          reject(new Error(response?.error || 'Failed to load messages'));
        }
      });
    });
  }, [socket]);


  const clearMessages = useCallback((roomId: string) => {
    setMessages(prev => {
      const { [roomId]: removed, ...rest } = prev
      return rest
    })
  }, [])


  const markMessageAsRead = useCallback((messageId: string, roomId: string) => {
    setMessages(prev => ({
      ...prev,
      [roomId]: prev[roomId]?.map(msg => 
        msg.messageId === messageId 
          ? { ...msg, read: true }
          : msg
      ) || []
    }))
  }, [])

  const getChatUserIds = useCallback(() => {
    const userIds = new Set<string>()
    
    // Extract all unique user IDs from room IDs
    Object.keys(messages).forEach(roomId => {
      const [user1, user2] = roomId.split('_')
      if (user1 !== currentUserId) userIds.add(user1)
      if (user2 !== currentUserId) userIds.add(user2)
    })
    
    return Array.from(userIds)
  }, [messages, currentUserId])

  const getUserFromMessages = useCallback((userId: string): ClientMetaData | null => {
    // If this is the current user, use client metadata
    if (userId === currentUserId) {
      return {
        uid: currentUserId,
        name: clientMetaData?.name || clientMetaData?.email?.split('@')[0] || currentUserId.substring(0, 8),
        email: clientMetaData?.email || `${currentUserId}@example.com`,
        avatar: clientMetaData?.avatar || undefined
      };
    }
    
    // Look through all messages to find metadata for this user
    for (const roomId in messagesRef.current) {
      const roomMessages = messagesRef.current[roomId];
      
      // Look for messages from this user (they'll have metadata)
      const messageWithMetadata = roomMessages.find(msg => 
        msg.fromId === userId && msg.metaData
      );
      
      if (messageWithMetadata?.metaData) {
        return {
          uid: userId,
          name: messageWithMetadata.metaData.name || messageWithMetadata.metaData.email?.split('@')[0] || userId.substring(0, 8),
          email: messageWithMetadata.metaData.email || `${userId}@example.com`,
          avatar: messageWithMetadata.metaData.avatar || undefined
        };
      }

      const messageWithToData = roomMessages.find(msg => 
        msg.toId === userId && msg.toData
      );

      if (messageWithToData?.toData) {
        return {
          uid: userId,
          name: messageWithToData.toData.name || messageWithToData.toData.email?.split('@')[0] || userId.substring(0, 8),
          email: messageWithToData.toData.email || `${userId}@example.com`,
          avatar: messageWithToData.toData.avatar || undefined
        };
      }
    }
    
    // If no metadata found, return basic user object
    return {
      uid: userId,
      name: userId.substring(0, 8),
      email: `${userId}@example.com`
    };
  }, [messages, currentUserId, clientMetaData, selectedUser]);


  // Update the getChatUsers function to prioritize local user data
  const getChatUsers = useCallback((): ClientMetaData[] => {
    // Extract all unique user IDs from room IDs and messages
    const userIds = new Set<string>();
    
    // Add users from known room IDs
    Object.keys(messagesRef.current).forEach(roomId => {
      const [user1, user2] = roomId.split('_');
      if (user1 !== currentUserId) userIds.add(user1);
      if (user2 !== currentUserId) userIds.add(user2);
    });
    
    // Add users from known users ref (populated from message metadata)
    Object.keys(knownUsersRef.current).forEach(userId => {
      if (userId !== currentUserId) userIds.add(userId);
    });
    
    // Convert user IDs to user objects
    return Array.from(userIds).map(userId => {
      // Check known users from messages
      if (knownUsersRef.current[userId]) {
        return knownUsersRef.current[userId];
      }
      
      // Fallback to basic user info
      return {
        uid: userId,
        name: userId.substring(0, 8),
        email: `${userId}@example.com`
      };
    });
  }, [currentUserId, userListVersion]);
  

  const getChatUsersLocalData = useCallback((): ClientMetaData[] => {
    const userMap = new Map<string, ClientMetaData>();
  
    // First add any users from our local data store
    Object.entries(localUserData).forEach(([userId, userData]) => {
      if (userId !== currentUserId) {
        userMap.set(userId, userData);
      }
    });
    
    // Extract all unique users from messages
    Object.values(messages).forEach(roomMessages => {
      roomMessages.forEach(message => {
        // Add sender if it's not the current user
        if (message.fromId !== currentUserId) {
          // If we already have this user from local data, prefer that
          if (!userMap.has(message.fromId)) {
            userMap.set(message.fromId, {
              uid: message.fromId,
              name: message.metaData?.name || message.metaData?.email || message.fromId.substring(0, 8),
              avatar: message.metaData?.avatar || undefined,
              email: message.metaData?.email || `${message.fromId}@example.com`
            });
          }
        }
        
        // Add recipient if it's not the current user
        if (message.toId && message.toId !== currentUserId) {
          // If we already have this user from local data, prefer that
          if (!userMap.has(message.toId)) {
            userMap.set(message.toId, {
              uid: message.toId,
              name: message.toData?.name || message.toData?.email || message.toId.substring(0, 8),
              avatar: message.toData?.avatar || undefined,
              email: message.toData?.email || `${message.toId}@example.com`
            });
          }
        }
      });
    });
    
    return Array.from(userMap.values());
  }, [messages, currentUserId, localUserData]);

  // Function to get user by ID for components to use
  const getUserById = useCallback((userId: string): ClientMetaData => {
    // getUserFromMessages already checks messages and provides fallbacks
    const userFromMessages = getUserFromMessages(userId);
    if (userFromMessages) return userFromMessages;
    
    // Only add the check for lastMessagesRef if not already in getUserFromMessages
    for (const [_, message] of lastMessagesRef.current.entries()) {
      if (message.fromId === userId && message.metaData) {
        return message.metaData;
      }
    }
    
    // Fallback to basic info
    return {
      uid: userId,
      name: userId.substring(0, 8),
      email: `${userId}@example.com`
    };
  }, [getUserFromMessages]);

  return (
    <ChatCtx.Provider value={{
      selectedUser,
      messages,
      isConnected,
      isTyping,
      pendingMessages: Object.keys(pendingMessages),
      currentUserId,
      clientAdditionalData: clientAdditionalData || null,
      clientMetaData: clientMetaData || null,
      deliveryStatus,
      setSelectedUser,
      sendMessage,
      setTypingStatus,
      clearMessages,
      markMessageAsRead,
      getLastMessage,
      getMessages,
      getConversations,
      getChatUserIds,
      getChatUsers,
      getChatUsersLocalData,
      getUserById,
      getRoomId,
      //getMessageStatus,
      subscribeToMessages,
      subscribeToErrors,
      subscribeToMessageStatus
    }}>
      {children}
    </ChatCtx.Provider>
  )
}