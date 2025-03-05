'use client'

import { useEffect, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "./ui/button"
import { formatDistanceToNow } from 'date-fns'
import { usePresence } from "@/app/providers/hooks/usePresence"
import { useChat } from "@/app/providers/internal/ChatCtx";
import type {  UserStatus, ChatMessage, ConversationData } from "@/app/providers/utils/socket"
import type { User, Chat} from '@/lib/db/types'
import { getChats } from "@/lib/chat"

interface ChatHistoryProps {
  selectedUserId?: string;
  onSelectChat: (user: User) => void;
}

interface LastMessageType {
  message: string;
  timestamp: string;
  fromId: string;
  toId: string;
  fromData?: any;
}


const ChatButtonItem = ({
  user,
  isSelected,
  onSelect,
  lastMessage,
  presence = 'unknown',
}: {
  user: User;
  isSelected: boolean;
  onSelect: (user: User) => void;
  lastMessage?: ChatMessage;
  presence?: UserStatus;
}) => {
  const { presenceUpdates } = usePresence();
  const { isTyping, subscribeToMessages } = useChat()

  const name = user.name || 
  (user.email ? user.email.split('@')[0] : user.uid.substring(0, 8));
  const avatarLetter = name[0].toUpperCase();
  const avatar = user.avatar || user.avatar;


  const userPresence = presenceUpdates.find(
    update => update.clientId === user.uid
  )?.presence;

  const isUserTyping = Boolean(isTyping[user.uid])

  const formatMessageTime = (timestamp: string) => {
    const distance = formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    return distance === 'less than a minute ago' ? 'now' : distance
  }

  const truncateMessage = (message: string, maxLength: number = 30) => {
    if (message.length <= maxLength) return message
    return `${message.substring(0, maxLength)}...`
  }
  
  return (
    <Button
      key={user.uid}
      onClick={() => onSelect(user)}
      variant="ghost"
      className={`w-full justify-start p-3 h-auto hover:bg-accent/50 transition-colors ${
        isSelected ? 'bg-accent' : ''
      }`}
    >
      <div className="flex items-start space-x-4 w-full">
        <div className="relative flex-shrink-0">
          <Avatar className="h-10 w-10 ring-2 ring-background">
            {user.avatar ? (
              <AvatarImage src={avatar} alt={name} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary">
                {avatarLetter}
              </AvatarFallback>
            )}
          </Avatar>
          <span 
            className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-background ${
              userPresence?.status === 'online' ? 'bg-green-500' : 
              userPresence?.status === 'busy' ? 'bg-red-500' : 
              userPresence?.status === 'away' ? 'bg-yellow-500' :
              userPresence?.status === 'offline' ? 'bg-gray-400' :
              'bg-slate-300'
            }`} 
          />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold truncate">
             {name}
            </span>
            {lastMessage?.timestamp && (
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {formatMessageTime(lastMessage.timestamp)}
              </span>
            )}
          </div>
          
          <div className="mt-1">
            {isUserTyping ? (
              <p className="text-xs text-muted-foreground italic">
                Typing...
              </p>
            ) : lastMessage ? (
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-xs text-muted-foreground truncate">
                  {lastMessage.fromId === user.uid ? `${name}: ` : 'You: '}
                  {truncateMessage(lastMessage.message)}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No messages yet
              </p>
            )}
          </div>
        </div>
      </div>
    </Button>
  )
}


export function ChatHistory({ 
  selectedUserId,
  onSelectChat 
}: ChatHistoryProps) {
  const { 
    selectedUser,
    setSelectedUser,
    subscribeToMessages,
    getConversations,
    getLastMessage
  } = useChat()

  const [conversations, setConversations] = useState<ConversationData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    let isMounted = true
    
    const loadConversations = async () => {
      try {
        setLoading(true)
        const result = await getConversations({ limit: 50, offset: 0 })
        
        if (isMounted) {
          setConversations(result.conversations)
          setHasMore(result.hasMore)
          setLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          setError((err as Error).message)
          setLoading(false)
        }
      }
    }

    const handleNewMessage = (message: ChatMessage) => {
      console.log('New message received:', message); // Debug log
      setConversations(prev => {
        return prev.map(conv => {
          // For sender's view: if otherUserId matches the recipient
          // For recipient's view: if otherUserId matches the sender
          const isRelevantConversation = 
            (message.fromId === conv.otherUserId) || 
            (message.toId === conv.otherUserId);

          if (isRelevantConversation) {
            console.log('Updating conversation for:', conv.otherUserId); // Debug log
            return {
              ...conv,
              lastMessage: message
            };
          }
          return conv;
        });
      });
    }
    
    loadConversations()
    const unsubscribe = subscribeToMessages(handleNewMessage)
    
    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [getConversations, subscribeToMessages])

  const { presenceUpdates, presenceState } = usePresence()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-muted-foreground">Loading conversations...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive">Error: {error}</div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-muted-foreground">No conversations yet</div>
      </div>
    )
  }


  return (
    <ScrollArea className="flex-1">
      <div>
        {conversations.map(conversation=> {
          const otherUserId = conversation.otherUserId;
          // Get presence status if available
          const presenceUpdate = presenceState.get(otherUserId)
          const status = presenceUpdate?.presence.status || 'unknown'
          const lastMessage = getLastMessage(otherUserId) || conversation.lastMessage;

          const user = {
            uid: otherUserId,
            name: otherUserId.substring(0, 8), // Use a shortened ID as name
            email: '',
            avatar: ''
          };
          
          
          return (
            <ChatButtonItem
              key={otherUserId}
              user={user}
              isSelected={selectedUser?.uid === otherUserId}
              onSelect={(user) => {
                setSelectedUser(user)
                onSelectChat(user)
              }}
              lastMessage={lastMessage}
              presence={status}
            />
          )
        })}
      </div>
    </ScrollArea>
  )
} 