import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useChat } from "@/app/providers/internal/ChatCtx"
import type { User } from '@/lib/db/types'
import { formatDistanceToNow } from 'date-fns'

interface MessageListProps {
  currentUserId: string
  selectedUser: User | null
}

export function MessageList({ currentUserId, selectedUser }: MessageListProps) {
  const { messages } = useChat()

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
    <ScrollArea className="flex-1 p-6">
      <div className="space-y-4">
        {conversationMessages.map((msg) => (
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
                  {msg.fromId === currentUserId ? 'You' : selectedUser.name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div
                className={`rounded-lg p-3 ${
                  msg.fromId === currentUserId
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{msg.message}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {formatDistanceToNow(new Date(msg.timestamp), { 
                    addSuffix: true 
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}