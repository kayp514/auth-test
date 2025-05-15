'use client'

import { useState, useCallback, useEffect } from 'react'
import type {  User } from '@/lib/db/types'

interface ChatParticipant extends User {
  lastMessage?: Date | null
  unreadCount?: number
}

export function useChatUsers() {
  const [chatUsers, setChatUsers] = useState<ChatParticipant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchChatUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/chats')
      const data = await response.json()
      
      if (data.success) {
        setChatUsers(data.users)
      } else {
        setError(data.error?.message || 'Failed to fetch chat users')
        setChatUsers([])
      }
    } catch (error) {
      console.error('Error fetching chat users:', error)
      setError('Failed to fetch chat users')
      setChatUsers([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChatUsers()
  }, [fetchChatUsers])

  return {
    chatUsers,
    isLoading,
    error,
    refreshChatUsers: fetchChatUsers
  }
}