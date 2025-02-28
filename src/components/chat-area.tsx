'use client'

import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send } from 'lucide-react'
import { ChatHeader } from "./chat-header"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import type { User } from '@/lib/db/types'
import { useChat } from "@/app/providers/internal/ChatCtx"
import { useSocket } from "@/app/providers/internal/SocketCtx"

interface ChatAreaProps {
  selectedUser: User | null
}

export function ChatArea({ selectedUser }: ChatAreaProps) {
  const { clientId } = useSocket()
  const { sendMessage, setTypingStatus } = useChat()

  const handleSendMessage = async (content: string) => {
    if (selectedUser && content.trim()) {
      await sendMessage(content, selectedUser.uid)
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