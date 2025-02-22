'use client'

import { useState, useCallback, useTransition } from 'react'
import { toast } from 'sonner'
import { searchUsersAction } from "@/app/actions/users"
import { useDebounce } from './use-debounce'
import type { SearchUser as User } from '@/lib/db/types'

export function useSearch() {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isPending, startTransition] = useTransition()

  const debouncedSearch = useDebounce(searchQuery, 300)

  const handleSearch = useCallback(async (query: string) => {
    if (!query) {
      setUsers([])
      return
    }

    try {
      const result = await searchUsersAction(query)
      
      if (result.success) {
        setUsers(result.users)
      } else {
        // Handle different error codes
        switch (result.error.code) {
          case 'INVALID_QUERY':
            // Don't show toast for empty queries
            break
          case 'NO_RESULTS':
            // Don't show error toast for no results
            setUsers([])
            break
          case 'SEARCH_ERROR':
            toast.error('Failed to search users', {
              description: result.error.message
            })
            setUsers([])
            break
          default:
            toast.error('An error occurred', {
              description: result.error.message
            })
            setUsers([])
        }
      }
    } catch (error) {
      console.error('Search hook error:', error)
      toast.error('Failed to search users', {
        description: 'Please try again later'
      })
      setUsers([])
    }
  }, [])

  // Use useCallback for search query updates
  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query)
    startTransition(() => {
      handleSearch(query)
    })
  }, [handleSearch])

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