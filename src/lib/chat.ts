import type { Chat } from "@/lib/db/types"

export async function getChats(): Promise<{
  success: boolean
  chats?: Chat[]
  error?: { code: string; message: string }
}> {
  try {
    const response = await fetch("/api/chats", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error || {
          code: "FETCH_ERROR",
          message: "Failed to fetch chats",
        },
      }
    }

    const data = await response.json()

    // Transform the API response to match our Chat type
    const chats: Chat[] = data.chats.map((chat: any) => {
      // Determine if the current user is the sender or recipient
      // and set the recipient accordingly
      const recipient = chat.senderId === chat.recipientId ? chat.sender : chat.recipient

      // Get the last message if available
      const lastMessage =
        chat.messages && chat.messages.length > 0
          ? {
              id: chat.messages[0].id,
              content: chat.messages[0].content,
              senderId: chat.messages[0].senderId,
              createdAt: new Date(chat.messages[0].createdAt),
              read: chat.messages[0].read,
            }
          : undefined

      return {
        id: chat.id,
        recipient,
        lastMessage,
        updatedAt: new Date(chat.lastMessage),
      }
    })

    return {
      success: true,
      chats,
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: "FETCH_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch chats",
      },
    }
  }
}

