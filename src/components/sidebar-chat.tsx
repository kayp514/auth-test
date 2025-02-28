'use client'

import { useState } from "react"
import { SearchUsers } from "./search-users"
import { ChatHistory } from "./chat-history"
import { SidebarFooter } from "./sidebar-footer"
import { Button } from "@/components/ui/button"
import { Plus } from 'lucide-react'
import type { User, Chat } from '@/lib/db/types'
import { NewMessageDialog } from "./new-message-dialog"

interface ChatSidebarProps {
  selectedUser: User | null
  onSelectUser: (user: User | null) => void
  onSelectChatUser: (user: User) => void
}


export function ChatSidebar({ selectedUser, onSelectUser, onSelectChatUser }: ChatSidebarProps) {
    const [isNewMessageOpen, setIsNewMessageOpen] = useState(false)
    
  return (
    <>
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <Button
            onClick={() => setIsNewMessageOpen(true)}
            variant="outline"
            size="sm"
            className="w-full flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Message
          </Button>
        </div>
        <SearchUsers 
          onSelectUser={onSelectUser} 
          selectedUser={selectedUser}
        />
      </div>

      <ChatHistory 
        selectedUserId={selectedUser?.uid}
        onSelectChat={onSelectChatUser}
      />

      <SidebarFooter />

      <NewMessageDialog 
        open={isNewMessageOpen}
        onOpenChange={setIsNewMessageOpen}
      />
    </>
  )
}