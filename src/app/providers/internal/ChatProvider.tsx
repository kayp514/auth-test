'use client'

import { useState, useEffect, useCallback} from 'react'
import { useSocket } from './SocketCtx'
import { ChatCtx } from './ChatCtx'
import type { ChatMessage, ChatError, ClientAdditionalData, ClientMetaData, MessageStatus } from "@/app/providers/utils/socket"
import type { User } from '@/lib/db/types'

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
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [localUserData, setLocalUserData] = useState<Record<string, User>>({})
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({})
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({})
  const [pendingMessages, setPendingMessages] = useState<Record<string, PendingMessage>>({})
  const [deliveryStatus, setDeliveryStatus] = useState<Record<string, MessageStatus>>({})
  const currentUserId = clientId


  const initializeChat = useCallback(() => {
    if (socket && isConnected) {
      // Send initial profile data if available
      if (clientAdditionalData) {
        console.log('Sending initial profile data:', clientAdditionalData);
        socket.emit('chat:profile_update', clientAdditionalData);
        console.log('Initial profile data sent:', clientAdditionalData);
      }
    }
  }, [socket, isConnected, clientAdditionalData]);

  useEffect(() => {
    if (socket && isConnected) {
      initializeChat()
    }
  }, [socket, isConnected, initializeChat])

  const getRoomId = useCallback((userId: string): string => {
    return [currentUserId, userId].sort().join('_')
  }, [currentUserId])

  // Handle incoming messages
  useEffect(() => {
    if (!socket) return

    const handleMessage = (message: ChatMessage) => {
      console.log('Received message:', message)


      if (message.fromId === currentUserId) {
        // Just update the pending status
        setPendingMessages(prev => {
          // Remove any pending messages with the same content to this recipient
          const newPending = { ...prev };
          
          Object.keys(newPending).forEach(pendingId => {
            const pendingMsg = newPending[pendingId].message;
            if (pendingMsg.message === message.message && 
                pendingMsg.toId === message.toId &&
                Math.abs(new Date(pendingMsg.timestamp).getTime() - new Date(message.timestamp).getTime()) < 5000) {
              delete newPending[pendingId];
            }
          });
          
          return newPending;
        });
        
        return; // Don't add the message again
      }
      

      setMessages(prev => {
        const existingMessages = prev[message.roomId] || [];
        
        // Check if we already have this exact message
        const messageExists = existingMessages.some(msg => 
          msg.messageId === message.messageId
        );
        
        if (messageExists) {
          return prev; // No change needed
        }
        
        // Add the new message
        const roomMessages = [...existingMessages, message];
        roomMessages.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        return {
          ...prev,
          [message.roomId]: roomMessages
        };
      });

      setDeliveryStatus(prev => ({
        ...prev,
        [message.messageId]: 'sent'
      }));
  
      onMessageReceived?.(message)
    }

    const handleDelivered = ({ messageId }: { messageId: string }) => {
      setPendingMessages(prev => {
        const newPending = { ...prev };
        delete newPending[messageId];
        return newPending;
      });

      setDeliveryStatus(prev => ({
        ...prev,
        [messageId]: 'delivered'
      }));
        
      onMessageDelivered?.(messageId)
    }

    const handleConfirmReceipt = (
      data: { messageId: string }, 
      callback?: (response: { received: boolean }) => void
    ) => {
      console.log('Confirming receipt of message:', data.messageId);
      
      // Always confirm receipt
      if (callback) {
        callback({ received: true });
      }
      
      return { received: true };
    }

    const handleError = (error: ChatError) => {
      onMessageError?.(error)
    }

    //const handleTyping = ({ fromId, isTyping }: { fromId: string; isTyping: boolean }) => {
   //   setIsTyping(prev => ({
    //    ...prev,
    //    [fromId]: isTyping
    //  }))
   //   onTypingStatusChange?.(fromId, isTyping)
   // }

    const handleProfileUpdated = () => {
      console.log('Profile updated successfully')
      onProfileUpdated?.()
    }

    socket.on('chat:message', handleMessage)
    socket.on('chat:delivered', handleDelivered)
    socket.on('chat:error', handleError)
    socket.on('chat:confirm_receipt', handleConfirmReceipt)
    //socket.on('chat:typing', handleTyping)
    socket.on('chat:profile_updated', handleProfileUpdated)

    return () => {
      socket.off('chat:message', handleMessage)
      socket.off('chat:delivered', handleDelivered)
      socket.off('chat:error', handleError)
      socket.off('chat:confirm_receipt', handleConfirmReceipt)
      //socket.off('chat:typing', handleTyping)
      socket.off('chat:profile_updated', handleProfileUpdated)
    }
  }, [socket, onMessageReceived, onMessageDelivered, onMessageError, onTypingStatusChange, onProfileUpdated])

  const updateClientData = useCallback((data: ClientAdditionalData) => {
    if (socket && isConnected) {
      socket.emit('chat:profile_update', data);
      console.log('Profile data updated:', data);
      onProfileUpdated?.();
    }
  }, [socket, isConnected, onProfileUpdated]);


  const sendMessage = useCallback(async (
    content: string,
    recipientId: string,
    recipientData?: User
  ): Promise<string> => {
    if (!socket || !isConnected) {
      throw new Error('Socket not connected')
    }

    const messageId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const roomId = getRoomId(recipientId)

    const recipientUser = recipientData || getUserById(recipientId);

    const metaData = clientMetaData || {
      name: currentUserId.substring(0, 8),
      email:  `${currentUserId}@example.com`,
    };


    const message: ChatMessage = {
      messageId,
      roomId,
      message: content,
      fromId: currentUserId,
      toId: recipientId,
      timestamp: new Date().toISOString(),
      metaData,
      toData: {
        name: recipientUser.name,
        email: recipientUser.email,
        avatar: recipientUser.avatar
      }
    }

    //setMessages(prev => {
    //  const roomMessages = [...(prev[roomId] || []), message];
    //  return {
    //    ...prev,
    //    [roomId]: roomMessages
    //  };
    //});

    setMessages(prev => {
      const existingMessages = prev[roomId] || []
      return {
        ...prev,
        [roomId]: [...existingMessages, message]
      }
    })

    setPendingMessages(prev => ({
      ...prev,
      [messageId]: {
        message,
        attempts: 1,
        timestamp: Date.now()
      }
    }))

    setDeliveryStatus(prev => ({
      ...prev,
      [messageId]: 'pending'
    }))


    try {
      await new Promise<void>((resolve, reject) => {
      socket.emit('chat:private', {
        targetId: recipientId,
        message: content,
        metaData
      }, (response: { success: boolean; messageId?: string; error?: string}) => {
        if(response.success) {

          setDeliveryStatus(prev => ({
            ...prev,
            [messageId]: 'sent'
          }));
          resolve();
        } else {
          setDeliveryStatus(prev => ({
            ...prev,
            [messageId]: 'error'
          }))
          reject(new Error(response.error || 'Failed to send message'));
        }
      });
    });
      onMessageSent?.(message)
      return messageId
    } catch (error) {
      console.error('Error sending message:', error)

      setDeliveryStatus(prev => ({
        ...prev,
        [messageId]: 'error'
      }))

      throw error
    }
  }, [socket, isConnected, currentUserId, getRoomId, onMessageSent, clientMetaData])

  const setTypingStatus = useCallback((isTyping: boolean, recipientId: string) => {
    //if (!socket || !isConnected) return

    //socket.emit('chat:typing', {
     // targetId: recipientId,
      //isTyping
    //})
  }, [socket, isConnected])

  const getLastMessage = useCallback((userId: string) => {
    const roomId = getRoomId(userId)
    const roomMessages = messages[roomId] || []
    return roomMessages[roomMessages.length - 1]
  }, [messages, getRoomId])

  const clearMessages = useCallback((roomId: string) => {
    setMessages(prev => {
      const { [roomId]: removed, ...rest } = prev
      return rest
    })
  }, [])


  const getMessageStatus = useCallback((messageId: string): MessageStatus => {
    console.log(`Getting status for message ${messageId}:`, 
      deliveryStatus[messageId] || (Object.keys(pendingMessages).includes(messageId) ? 'pending' : 'sent'));
      
    if (deliveryStatus[messageId]) {
      return deliveryStatus[messageId];
    }
    
    if (Object.keys(pendingMessages).includes(messageId)) {
      return 'pending';
    }
    
    return 'sent';
  }, [deliveryStatus, pendingMessages]);

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

  const getUserFromMessages = useCallback((userId: string): User | null => {
    // If this is the current user, use client metadata
    if (userId === currentUserId) {
      return {
        uid: currentUserId,
        name: clientMetaData?.name || clientMetaData?.email?.split('@')[0] || currentUserId.substring(0, 8),
        email: clientMetaData?.email || `${currentUserId}@example.com`,
        avatar: clientMetaData?.avatar || undefined
      };
    }

   // if (selectedUser && selectedUser.uid === userId) {
   //   return selectedUser;
   // }
    
    // Look through all messages to find metadata for this user
    for (const roomId in messages) {
      const roomMessages = messages[roomId];
      
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
  const getChatUsers = useCallback((): User[] => {
    const userIds = new Set<string>();
    
    // Extract all unique user IDs from room IDs
    Object.keys(messages).forEach(roomId => {
      const [user1, user2] = roomId.split('_');
      if (user1 !== currentUserId) userIds.add(user1);
      if (user2 !== currentUserId) userIds.add(user2);
    });
    
    // Convert user IDs to user objects using message metadata
    return Array.from(userIds).map(userId => getUserFromMessages(userId) || {
      uid: userId,
      name: userId.substring(0, 8),
      email: `${userId}@example.com`
    });
  }, [messages, currentUserId, getUserFromMessages]);

  const getChatUsersLocalData = useCallback((): User[] => {
    const userMap = new Map<string, User>();
  
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
  const getUserById = useCallback((userId: string): User => {
    return getUserFromMessages(userId) || {
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
      getChatUserIds,
      getChatUsers,
      getChatUsersLocalData,
      getUserById,
      getRoomId,
      updateClientData,
      getMessageStatus
    }}>
      {children}
    </ChatCtx.Provider>
  )
}