'use client'
import { useEffect, useRef, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useChat } from "@/app/providers/internal/ChatCtx"
import type { User } from '@/lib/db/types'
import { formatDistanceToNow } from 'date-fns'
import {
  ClockIcon,
  CheckIcon,
  CheckCheckIcon,
  AlertCircleIcon,
} from 'lucide-react'
import { MessageStatus, ChatMessage } from "@/app/providers/utils/socket"

const statusSounds = {
  sent: new Audio('/sounds/sent.mp3'),
  delivered: new Audio('/sounds/sent.mp3')
}

Object.values(statusSounds).forEach(sound => {
  sound.load()
  sound.volume = 0.4
})

interface MessageListProps {
  currentUserId: string
  selectedUser: User | null
}


export function MessageList({ currentUserId, selectedUser }: MessageListProps) {
  const { getMessages, messages, subscribeToMessages, subscribeToMessageStatus } = useChat()
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messageStatuses, setMessageStatuses] = useState<Record<string, MessageStatus>>({})

  useEffect(() => {
    const handleStatusChange = (messageId: string, newStatus: MessageStatus) => {
      const previousStatus = messageStatuses[messageId];
      if (previousStatus !== newStatus) {
        console.log(`Message-List: Status changed for message ${messageId}: ${previousStatus} -> ${newStatus}`);
        if (newStatus === 'sent') {
          statusSounds.sent.play().catch(() => {});
        }
      }
    };

    const unsubscribe = subscribeToMessageStatus((messageId, status) => {
      handleStatusChange(messageId, status as MessageStatus);
      setMessageStatuses(prev => ({
        ...prev,
        [messageId]: status as MessageStatus
      }));
    });

    return () => {
      unsubscribe();
    };
  }, [subscribeToMessageStatus]);


  const formatMessageTime = (timestamp: string) => {
    const distance = formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    return distance === 'less than a minute ago' ? 'now' : distance
  }

  const renderMessageStatus = (messageId: string) => {
    const status = messageStatuses[messageId] || 'pending';
    
    return (
      <span className="flex items-center transition-opacity duration-200">
        {status === 'pending' && (
          <ClockIcon className="h-3 w-3 text-current animate-pulse" />
        )}
        {status === 'sent' && (
          <CheckIcon className="h-3 w-3 text-current animate-in fade-in" />
        )}
        {status === 'delivered' && (
          <CheckCheckIcon className="h-3 w-3 text-current animate-in fade-in" />
        )}
        {status === 'error' && (
          <AlertCircleIcon className="h-3 w-3 text-red-500 animate-in fade-in" />
        )}
      </span>
    );
  };

  useEffect(() => {
    if (!selectedUser) return;
    
    const roomId = [currentUserId, selectedUser.uid].sort().join('_');
    setLoading(true);
    
    getMessages(roomId, { limit: 50 })
      .then(() => {
        setLoading(false);
        setError(null);
      })
      .catch(err => {
        console.error("Failed to load messages:", err);
        setLoading(false);
        setError("Failed to load messages");
      });
  }, [selectedUser, currentUserId, getMessages]);


  useEffect(() => {
    if (!selectedUser) return;
    
    const roomId = [currentUserId, selectedUser.uid].sort().join('_');
    
    // Handle new messages
    const handleNewMessage = (message: ChatMessage) => {
      // Only process messages for the current conversation
      if (message.roomId === roomId) {
        // Play sound for incoming messages
        if (message.fromId !== currentUserId) {
          // You could add a message received sound here
        }
      }
    };

    console.log(`Subscribing to real-time messages for room ${roomId}`);
    
    // Subscribe to new messages
    const unsubscribe = subscribeToMessages(handleNewMessage);
    
    return () => {
      console.log(`Unsubscribing from real-time messages for room ${roomId}`);
      unsubscribe();
    };
  }, [selectedUser, currentUserId, subscribeToMessages]);


  useEffect( () => {
    if (scrollRef.current && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages, selectedUser])

  if (!selectedUser) {
    return (
      <ScrollArea className="flex-1 p-6">
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground text-sm">
            Select a user to start chatting
          </p>
        </div>
      </ScrollArea>
    )
  }

  const roomId = [currentUserId, selectedUser.uid].sort().join('_')
  const conversationMessages = messages[roomId] || []

  if (loading) {
    return (
      <ScrollArea className="flex-1 p-6">
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground text-sm">
            Loading messages...
          </p>
        </div>
      </ScrollArea>
    )
  }

  if (error) {
    return (
      <ScrollArea className="flex-1 p-6">
        <div className="flex items-center justify-center h-full">
          <p className="text-destructive text-sm">
            {error}
          </p>
        </div>
      </ScrollArea>
    )
  }


  if (conversationMessages.length === 0) {
    return (
      <ScrollArea className="flex-1 p-6">
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground text-sm">
            No messages yet. Start the conversation!
          </p>
        </div>
      </ScrollArea>
    )
  }

  return (
    <ScrollArea ref={scrollAreaRef} className="flex-1 p-6">
      <div ref={scrollRef} className="space-y-4">
        {conversationMessages.map((msg) => (
          //const isSentByMe = msg.fromId === currentUserId
          <div
            key={msg.messageId}
            className={`flex ${msg.fromId === currentUserId ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex items-start space-x-2 max-w-[70%] ${
                msg.fromId === currentUserId ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {msg.fromId === currentUserId ? 'ME' : selectedUser.name?.[0].toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div
                className={`rounded-2xl p-4 shadow-sm ${
                  msg.fromId === currentUserId
                    ? 'bg-gradient-to-br from-primary/90 to-primary text-primary-foreground'
                    : 'bg-muted/50 dark:bg-muted/80'
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.message}</p>
                <div className="flex items-center justify-between mt-1 space-x-2">
                <span className="text-xs opacity-70">
                  {formatMessageTime(msg.timestamp)}
                </span>
                {msg.fromId === currentUserId && (
                  <span className="flex items-center">
                  {/*<MessageStatusIndicator messageId={msg.messageId} /> */}
                  {renderMessageStatus(msg.messageId)}
                  </span>
                )}
              </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}