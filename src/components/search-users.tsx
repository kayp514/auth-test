'use client'

import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from 'sonner'
import { useState, useCallback, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Search } from 'lucide-react'
import { searchUsersAction } from "@/app/actions/users"
import { useDebounce } from "@/app/hooks/use-debounce"

export interface User {
  uid: string
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
  const [isPending, startTransition] = useTransition()
  const [users, setUsers] = useState<User[]>([])
  const debouncedSearch = useDebounce(searchQuery, 300)


  useEffect(() => {
    if (debouncedSearch.length === 0) {
      setUsers([])
      return
    }

    startTransition(async () => {
      try {
        const result = await searchUsersAction(debouncedSearch)
        
        if (result.success) {
          setUsers(result.users)
        } else {
          // Handle error with toast
          toast.error(result.error.message)
          setUsers([])
        }
      } catch (error) {
        console.error('Failed to fetch users:', error)
        toast.error('Failed to search users')
        setUsers([])
      }
    })
  }, [debouncedSearch, toast])

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
            setTimeout(() => setIsFocused(false), 200)
          }}
          className="pl-8"
        />
      </div>

      {searchQuery && isFocused && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg">
          <div className="p-2 space-y-2">
            {isPending ? (
             <div className="text-sm text-muted-foreground text-center py-4">
              Searching...
             </div>
            ) : (
              <>
                {users.map((user) => (
                  <Button
                    key={user.uid}
                    onClick={() => {
                      onSelectUser(user)
                      setSearchQuery('')
                      setIsFocused(false)
                    }}
                    variant="ghost"
                    className={`w-full justify-start px-2 ${
                      selectedUser?.uid === user.uid ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-4 w-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
                      </div>
                    </div>
                  </Button>
                ))}

                {users.length === 0 && searchQuery && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No users found
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}