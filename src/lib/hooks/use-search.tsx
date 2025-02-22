'use client'

import { useState, useCallback, useTransition, useEffect } from 'react'
import { toast } from 'sonner'
import { useDebounce } from './use-debounce'
import type { SearchUser as User } from '@/lib/db/types'

export function useSearch() {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isPending, startTransition] = useTransition()

  const debouncedSearch = useDebounce(searchQuery, 300)

  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query)


    startTransition(async () => {
      try {
        const response = await fetch(`/api/users/?q=${encodeURIComponent(query)}`)
        const data = await response.json()
        
        if (data.success) {
          setUsers(data.users)
        } else {
          setUsers([])
        }
      } catch (error) {
        console.error('Search error:', error)
        setUsers([])
      }
    })
  }, [])

  return {
    users,
    searchQuery,
    isPending,
    updateSearchQuery,
    clearSearch: useCallback(() => {
      setSearchQuery('')
      setUsers([])
    }, [])
  }
}