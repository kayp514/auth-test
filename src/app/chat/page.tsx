'use client'

import { Chat } from "@/components/chat"
import { ChatProvider } from "../providers/internal/ChatProvider"
import { useAuth } from '@/app/providers/hooks/useAuth'
import { ClientMetaData } from "../providers/utils/socket"

export default function Page() {
  const { user } = useAuth()

  const metaData: ClientMetaData = {
    uid: user?.uid,
    name: user?.displayName,
    email: user?.email,
    avatar: user?.photoURL
  }

  return (
    <ChatProvider clientMetaData={metaData}>
     <div className="container h-[calc(100vh-2rem)] mx-auto p-4">
      <div className="grid h-full grid-cols-1 md:grid-cols-4 gap-4">
      <Chat />
      </div>
      </div>
    </ChatProvider>
  )
}