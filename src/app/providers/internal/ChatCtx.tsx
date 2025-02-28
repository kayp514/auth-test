'use client'

import { createContext, useContext } from "react"
import type {  ChatMessage, ChatError, MessageStatus, ClientAdditionalData, ClientMetaData} from "@/app/providers/utils/socket"
import type { User } from '@/lib/db/types'

export interface ChatCtxState {
  selectedUser: User | null
  messages: Record<string, ChatMessage[]>
  isConnected: boolean
  isTyping: Record<string, boolean>
  pendingMessages: string[]
  currentUserId: string 
  clientAdditionalData: ClientAdditionalData | null
  clientMetaData: ClientMetaData | null
}

export interface ChatCtxActions {
  setSelectedUser: (user: User | null) => void
  sendMessage: (content: string, recipientId: string, recipientData?: User) => Promise<string>
  setTypingStatus: (isTyping: boolean, recipientId: string) => void
  clearMessages: (roomId: string) => void
  markMessageAsRead: (messageId: string, roomId: string) => void
  getLastMessage: (userId: string) => ChatMessage | undefined
  getChatUserIds: () => string[]
  getChatUsers: () => User[]
  getChatUsersLocalData: () => User[], 
  getUserById: (userId: string) => User
  getRoomId: (userId: string) => string
  updateClientData: (data: ClientAdditionalData) => void
}

export interface ChatEventHandlers {
  onMessageSent?: (message: ChatMessage) => void
  onMessageReceived?: (message: ChatMessage) => void
  onMessageDelivered?: (messageId: string) => void
  onMessageError?: (error: ChatError) => void
  onTypingStatusChange?: (userId: string, isTyping: boolean) => void
  onProfileUpdated?: () => void
}

export interface ChatCtxValue extends ChatCtxState, ChatCtxActions {}
  
export const ChatCtx = createContext<ChatCtxValue | undefined>(undefined)
ChatCtx.displayName = "ChatContext"

export function useChat() {
    const context = useContext(ChatCtx)
    if (context === undefined) {
      throw new Error('useChat must be used within a ChatProvider')
    }
    return context
}

export function isPendingMessage(messageId: string, context: ChatCtxValue): boolean {
    return context.pendingMessages.includes(messageId)
}

export function getMessageStatus(
  messageId: string, 
  context: ChatCtxValue
): MessageStatus {
  if (context.pendingMessages.includes(messageId)) {
    return 'pending'
  }
  // Add more status checks as needed
  return 'delivered'
}