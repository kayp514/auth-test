'use client'

import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "./ui/button"
import { formatDistanceToNow } from 'date-fns'
import { usePresence } from "@/app/providers/hooks/usePresence"
import { useChat } from "@/app/providers/internal/ChatCtx";
import type {  UserStatus, ChatMessage } from "@/app/providers/utils/socket"
import type { User } from '@/lib/db/types'

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


const getUserDisplayInfo = (userId: string, messages: Record<string, any>, currentUserId: string) => {
  // Look through messages to find user profile data
  for (const roomId in messages) {
    const roomMessages = messages[roomId];
    for (const message of roomMessages) {
      // If this is a message from the user we're looking for
      if (message.fromId === userId && message.fromData) {
        // Get name with fallbacks: name → email (before @) → userId
        const name = message.fromData.name || 
                    (message.fromData.email ? message.fromData.email.split('@')[0] : userId.substring(0, 8));
        
        return {
          name,
          avatarLetter: name[0].toUpperCase(),
          avatar: message.fromData.avatar,
          email: message.fromData.email
        };
      }
      
      // If this is a message to the user we're looking for
      if (message.fromId === currentUserId && userId === message.toId) {
        // Get name with fallbacks: name → email (before @) → userId
        const name = message.toData?.name || 
                    (message.toData?.email ? message.toData.email.split('@')[0] : userId.substring(0, 8));
        
        return {
          name,
          avatarLetter: name[0].toUpperCase(),
          avatar: message.toData?.avatar,
          email: message.toData?.email
        };
      }
    }
  }
  
  // Fallback to ID-based display
  return {
    name: userId.substring(0, 8),
    avatarLetter: userId[0].toUpperCase(),
    avatar: undefined,
    email: undefined
  };
};

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
  const { isTyping } = useChat()

  const name = user.name || 
  (user.email ? user.email.split('@')[0] : user.uid.substring(0, 8));
  const avatarLetter = name[0].toUpperCase();
  const avatar = user.avatar || user.avatar;


  const userPresence = presenceUpdates.find(
    update => update.clientId === user.uid
  )?.presence;

  const isUserTyping = Boolean(isTyping[user.uid])
  
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
                {formatDistanceToNow(new Date(lastMessage.timestamp), { 
                  addSuffix: true 
                })}
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
                  {lastMessage.message}
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
    getLastMessage,
    getChatUsers,
    getChatUsersLocalData,
    getUserById
  } = useChat()

  const { presenceUpdates, presenceState } = usePresence()
  const chatUsers = getChatUsers()

  
  return (
    <ScrollArea className="flex-1">
      <div>
        {chatUsers.map(chatUser=> {
          // Get presence status if available
          const presenceUpdate = presenceState.get(chatUser.uid)
          const status = presenceUpdate?.presence.status || 'unknown'
          const lastMessage = getLastMessage(chatUser.uid)

          const user = getUserById(chatUser.uid)
          
          
          return (
            <ChatButtonItem
              key={chatUser.uid}
              user={chatUser}
              isSelected={selectedUser?.uid === chatUser.uid}
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