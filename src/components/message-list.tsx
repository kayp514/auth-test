'use client'
import { useEffect, useRef } from "react"
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

const MessageStatusIndicator = ({ messageId }: { messageId: string }) => {
  const { getMessageStatus } = useChat()
  const status = getMessageStatus(messageId)
  const previousStatus = useRef(status)

  useEffect(() => {
    if (status !== previousStatus.current) {
      if (status === 'sent') {
        statusSounds.sent.play().catch(() => {})
      } else if (status === 'delivered') {
        statusSounds.delivered.play().catch(() => {})
      }
      previousStatus.current = status
    }
  }, [status])
  
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
  )
}

export function MessageList({ currentUserId, selectedUser }: MessageListProps) {
  const { messages, deliveryStatus, pendingMessages } = useChat()
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)


  const formatMessageTime = (timestamp: string) => {
    const distance = formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    return distance === 'less than a minute ago' ? 'now' : distance
  }

  useEffect(() => {
    console.log('Delivery status updated:', deliveryStatus)
  }, [deliveryStatus])
  
  useEffect(() => {
    console.log('Pending messages updated:', pendingMessages)
  }, [pendingMessages])

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
                  <MessageStatusIndicator messageId={msg.messageId} />
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