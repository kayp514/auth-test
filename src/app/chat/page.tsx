'use client'

import { useState } from "react"
import { SearchUsers } from "@/components/search-users"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { LogOut, Send, ChevronUp, Plus } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NewMessageDialog } from "@/components/new-message-dialog"
import { SignOutLink } from "@/app/providers/components/sign-out-link-construct-v2"
import { useAuth } from "@/app/providers/hooks/useAuth"
import type { PresenceUpdate} from "@/app/providers/utils/socket"
import { usePresence } from "@/app/providers/hooks/usePresence"
import type { SearchUser as User } from '@/lib/db/types'
import { useSearch } from "@/lib/hooks/use-search"

interface Message {
  id: string
  content: string
  senderId: string
  timestamp: Date
}

export default function ChatPage() {
  const { user } = useAuth();
  const { updatePresence, presenceUpdates } = usePresence();
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [message, setMessage] = useState('')
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false)
  const [newMessageRecipient, setNewMessageRecipient] = useState<User | null>(null)
  const [newMessageContent, setNewMessageContent] = useState('')
  const { users, searchQuery, isPending, updateSearchQuery } = useSearch()

  const currentUserPresence = presenceUpdates.find(
    (update: PresenceUpdate) => update.clientId === user?.uid
  )?.presence;

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )
  

  const handleNewMessage = () => {
    if (newMessageRecipient && newMessageContent.trim()) {
      // Handle sending the new message
      setSelectedUser(newMessageRecipient)
      setIsNewMessageOpen(false)
      setNewMessageRecipient(null)
      setNewMessageContent('')
    }
  }

  // Mock messages - replace with actual data
  const messages: Message[] = [
    {
      id: '1',
      content: 'Hey, how are you?',
      senderId: '0',
      timestamp: new Date('2024-02-21T10:00:00')
    },
    {
      id: '2',
      content: 'I\'m good, thanks! How about you?',
      senderId: '1',
      timestamp: new Date('2024-02-21T10:01:00')
    },
    // Add more mock messages
  ]

  return (
    <div className="container h-[calc(100vh-2rem)] mx-auto p-4">
      <div className="grid h-full grid-cols-1 md:grid-cols-4 gap-4">
        {/* User List Card */}
        <Card className="col-span-1 flex flex-col h-full">
          {/* Search Header */}
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
              onSelectUser={setSelectedUser} 
              selectedUser={selectedUser}
            />
          </div>

          {/* User List */}
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-2 pr-4">
              {filteredUsers.map((chatUser) => {
                const userPresence = presenceUpdates.find(
                  (update: PresenceUpdate) => update.clientId === chatUser.uid
                )?.presence;
                
                return (
                  <button
                    key={chatUser.uid}
                    onClick={() => setSelectedUser(chatUser)}
                    className={`w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-accent ${
                      selectedUser?.uid === chatUser.uid ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="relative">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={chatUser.avatar} />
                        <AvatarFallback>{chatUser.name[0]}</AvatarFallback>
                      </Avatar>
                      <span 
                        className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${
                          userPresence?.status === 'online' ? 'bg-green-500' : 
                          userPresence?.status === 'busy' ? 'bg-red-500' : 
                          userPresence?.status === 'away' ? 'bg-yellow-500' :
                          userPresence?.status === 'offline' ? 'bg-gray-400' :
                          'bg-slate-300'
                        }`}
                      />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{chatUser.name}</span>
                      <span className="text-xs text-muted-foreground">{chatUser.email}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>

          {/* User Footer */}
          <div className="p-4 border-t mt-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.photoURL || ''} />
                    <AvatarFallback>{user?.email ? user.email[0].toUpperCase() : 'U'}</AvatarFallback>
                  </Avatar>
                  <span 
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                      currentUserPresence?.status === 'online' ? 'bg-green-500' : 
                      currentUserPresence?.status === 'busy' ? 'bg-red-500' : 
                      currentUserPresence?.status === 'away' ? 'bg-yellow-500' :
                      currentUserPresence?.status === 'offline' ? 'bg-gray-400' :
                      'bg-slate-300'
                    }`} 
                  />
                </div>
                <div className="flex flex-col space-y-0.5">
                  <span className="text-base font-semibold leading-none">{user?.displayName || ''}</span>
                  <span className="text-sm text-muted-foreground">{user?.email || ''}</span>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => updatePresence('online')}>
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                    Online
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updatePresence('busy')}>
                    <div className="h-2 w-2 rounded-full bg-red-500 mr-2" />
                    Do not disturb
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updatePresence('away')}>
                    <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2" />
                    Away
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updatePresence('offline')}>
                    <div className="h-2 w-2 rounded-full bg-gray-400 mr-2" />
                    Offline
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LogOut className="h-4 w-4 mr-2" />
                    <SignOutLink />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Card>

        {/* Chat Area Card */}
        <Card className="col-span-1 md:col-span-3 flex flex-col h-full">
          {/* Chat Header */}
          {selectedUser ? (
            <div className="px-6 py-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={selectedUser.avatar} />
                    <AvatarFallback>{selectedUser.name[0]}</AvatarFallback>
                  </Avatar>
                  <span 
                    className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${
                      presenceUpdates.find((update: PresenceUpdate) => update.clientId === selectedUser.uid)?.presence?.status === 'online' ? 'bg-green-500' : 
                      presenceUpdates.find((update: PresenceUpdate) => update.clientId === selectedUser.uid)?.presence?.status === 'busy' ? 'bg-red-500' : 
                      presenceUpdates.find((update: PresenceUpdate) => update.clientId === selectedUser.uid)?.presence?.status === 'away' ? 'bg-yellow-500' :
                      presenceUpdates.find((update: PresenceUpdate) => update.clientId === selectedUser.uid)?.presence?.status === 'offline' ? 'bg-gray-400' :
                      'bg-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">{selectedUser.name}</h2>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-6 py-4 border-b">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Select a conversation
              </h2>
            </div>
          )}

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {selectedUser ? (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex items-start space-x-2 max-w-[70%] ${
                        msg.senderId === user?.uid ? 'flex-row-reverse space-x-reverse' : ''
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={msg.senderId === user?.uid ? user?.photoURL || '' : selectedUser.avatar} 
                        />
                        <AvatarFallback>
                          {msg.senderId === user?.uid ? user?.displayName?.[0] || '' : selectedUser.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`rounded-lg p-3 ${
                          msg.senderId === user?.uid
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <span className="text-xs opacity-70 mt-1 block">
                          {msg.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground text-sm">
                    Select a user to start chatting
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t mt-auto">
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                if (message.trim()) {
                  // Handle message send
                  setMessage('')
                }
              }}
              className="flex space-x-2"
            >
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={selectedUser ? "Type your message..." : "Select a user to start chatting"}
                className="flex-1"
                disabled={!selectedUser}
              />
              <Button type="submit" disabled={!selectedUser || !message.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
      <NewMessageDialog 
    open={isNewMessageOpen} 
    onOpenChange={setIsNewMessageOpen}
  />
    </div>
  )
}