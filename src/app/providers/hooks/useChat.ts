import { useContext, useCallback, useMemo } from 'react';
import { SocketCtx } from '@/app/providers/internal/SocketCtx';
import type { ChatMessage } from '@/app/providers/internal/SocketCtx';

interface UseChatProps {
  roomId: string;
}

export const useChat = ({ roomId }: UseChatProps) => {
  const { socket, messages, isConnected } = useContext(SocketCtx);

  // Filter messages for specific room
  const roomMessages = useMemo(() => {
    return messages.filter((message: ChatMessage) => message.roomId === roomId);
  }, [messages, roomId]);

  // Send message function
  const sendMessage = useCallback((message: string) => {
    if (!socket || !isConnected) {
      console.warn('Socket not connected');
      return;
    }

    socket.emit('chat:private', {
      roomId,
      message,
      timestamp: new Date(),
    });
  }, [socket, isConnected, roomId]);

  // Load historical messages
  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/${roomId}/history`);
      if (!response.ok) {
        throw new Error('Failed to load chat history');
      }
      const history = await response.json();
      return history;
    } catch (error) {
      console.error('Error loading chat history:', error);
      return [];
    }
  }, [roomId]);

  return {
    messages: roomMessages,
    sendMessage,
    loadHistory,
    isConnected,
  };
};