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

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface NewMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSend?: (user: User, message: string) => void
}

export function NewMessageDialog({ open, onOpenChange, onSend }: NewMessageDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [message, setMessage] = useState('')

  // Mock users - replace with your actual user data
  const users: User[] = [
    { 
      id: '1', 
      name: 'Jane Smith', 
      email: 'jane@example.com',
      avatar: '/placeholder.svg'
    },
    { 
      id: '2', 
      name: 'Bob Johnson', 
      email: 'bob@example.com',
      avatar: '/placeholder.svg'
    },
  ]

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleStartChat = () => {
    if (selectedUser && message.trim()) {
      onSend?.(selectedUser, message)
      onOpenChange(false)
      setSelectedUser(null)
      setMessage('')
      setSearchQuery('')
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
                      key={user.id}
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
              setSearchQuery('')
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