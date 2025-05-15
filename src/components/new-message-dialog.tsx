'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, X } from 'lucide-react'
import { Textarea } from "@/components/ui/textarea"
import type { User, Chat } from '@/lib/db/types'
import { useSearch } from '@/lib/hooks/use-search'
import { useChat } from '@/app/providers/internal/ChatCtx'


interface NewMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSend?: (user: User, message: string) => void
}

export function NewMessageDialog({ open, onOpenChange, onSend }: NewMessageDialogProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [message, setMessage] = useState('')
  const [ isSending, setIsSending ] = useState(false)
  const { users, searchQuery, isPending, updateSearchQuery } = useSearch()
  const { sendMessage } = useChat()



  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleStartChat = async () => {
    if (!selectedUser || !message.trim() ) return //check here if is connected needed

    setIsSending(true)
    try {
      const response =  await fetch('api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: selectedUser.uid,
          content: message.trim()
        })
      })

      const data =  await response.json()
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to ')
      }

      // Send the message via socket after DB save is successful
      await sendMessage(
        message.trim(),
        selectedUser.uid,
        selectedUser
      )

      onOpenChange(false)
      setSelectedUser(null)
      setMessage('')

      if (onSend) {
        onSend(selectedUser, message)
      }

    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Recipient Search */}
          <div className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => updateSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            {selectedUser ? (
              <div className="flex items-center gap-2 p-2 border rounded-md">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedUser?.avatar} />
                  <AvatarFallback>{selectedUser?.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{selectedUser?.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser?.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedUser(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[200px] border rounded-md">
                <div className="p-2 space-y-2">
                  {filteredUsers.map((user) => (
                    <Button
                      key={user.uid}
                      variant="ghost"
                      className="w-full justify-start px-2"
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex items-center space-x-2 w-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </Button>
                  ))}
                  {filteredUsers.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No users found
                    </p>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <Textarea
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => {
              onOpenChange(false)
              setSelectedUser(null)
              setMessage('')
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStartChat}
            disabled={!selectedUser || !message.trim()}
          >
            Send Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}