'use client'

import { ChatHeader } from "./chat-header"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import type { User } from '@/lib/db/types'
import { useChat } from "@/app/providers/internal/ChatCtx"
import { useWebSkt } from "@/app/providers/internal/SocketWebSktCtx"

interface ChatAreaProps {
  selectedUser: User | null
}

export function ChatArea({ selectedUser }: ChatAreaProps) {
  const { clientId } = useWebSkt()
  const { sendMessage, setTypingStatus } = useChat()

  const handleSendMessage = async (content: string) => {
    if (selectedUser && content.trim()) {
      await sendMessage(content, selectedUser.uid, selectedUser)
    }
  }

  const handleTyping = (isTyping: boolean) => {
    if (selectedUser) {
      setTypingStatus(isTyping, selectedUser.uid)
    }
  }

  return (
    <>
      <ChatHeader selectedUser={selectedUser} />
      <MessageList 
        currentUserId={clientId} 
        selectedUser={selectedUser} 
      />
      <MessageInput 
        onSendMessage={handleSendMessage} 
        onTyping={handleTyping}
        disabled={!selectedUser}
      />
    </>
  )
}