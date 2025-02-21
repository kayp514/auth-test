'use client'

import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Search } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface SearchUsersProps {
  onSelectUser: (user: User) => void
  selectedUser: User | null
}

export function SearchUsers({ onSelectUser, selectedUser }: SearchUsersProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  
  // Mock users - replace with actual data
  const users: User[] = [
    { 
      id: '1', 
      name: 'John Doe', 
      email: 'john@example.com',
      avatar: '/placeholder.svg'
    },
    { 
      id: '2', 
      name: 'Jane Smith', 
      email: 'jane@example.com',
      avatar: '/placeholder.svg'
    },
    // Add more mock users as needed
  ]

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Small delay to allow clicking on results
            setTimeout(() => setIsFocused(false), 200)
          }}
          className="pl-8"
        />
      </div>

      {/* Show results only when searching and focused */}
      {searchQuery && isFocused && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg">
          <div className="p-2 space-y-2">
            {filteredUsers.map((user) => (
              <Button
                key={user.id}
                onClick={() => {
                  onSelectUser(user)
                  setSearchQuery('')
                  setIsFocused(false)
                }}
                variant="ghost"
                className={`w-full justify-start px-2 ${
                  selectedUser?.id === user.id ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-center space-x-4 w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
                  </div>
                </div>
              </Button>
            ))}

            {filteredUsers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                No users found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}