'use client'

import { useState } from "react"
import { ChatSidebar } from "@/components/sidebar-chat"
import { ChatArea } from "@/components/chat-area"
import { Card } from "@/components/ui/card"
import type { User } from '@/lib/db/types'

export function Chat() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const handleSelectChatUser = (chatUser: User) => {
    if (chatUser) {
      setSelectedUser({
        uid: chatUser.uid,
        name: chatUser.name || 'Anonymous',
        email: chatUser.email || `${chatUser.uid}@example.com`,
        avatar: chatUser.avatar
      })
    }
  }

  const handleSelectUser = (user: User | null) => {
    setSelectedUser(user)
  }

  return (
    <>
      <Card className="col-span-1 flex flex-col h-[calc(100vh-2rem)]">
        <ChatSidebar 
          selectedUser={selectedUser}
          onSelectUser={handleSelectUser}
          onSelectChatUser={handleSelectChatUser}
        />
      </Card>

      <Card className="col-span-1 md:col-span-3 flex flex-col h-[calc(100vh-2rem)]">
       <ChatArea selectedUser={selectedUser} />
      </Card>
    </>
  )
}