'use server'

import { prisma } from '@/lib/prisma';
import type { DatabaseUserInput, SearchResult } from './types';


export async function getUser(uid: string) {
  console.log("1. getUser called with id:", uid)
  try {
    console.log("2. Attempting prisma.user.findUnique")
    const dbUser = await prisma.users.findUnique({
      where: { uid },
      select : {
        uid: true,
        email: true,
        emailVerified: true,
      }
    })
    console.log("3. prisma query result:", dbUser)

    if (!dbUser) {
      console.log("4. No user found in database")
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        },
      }
    }
    console.log("5. User found, returning success")
    return {
      success: true,
      user: dbUser
    }
  } catch (error) {
    console.error('6. Error in getUser:', error)
    console.error('6a. Full error details:', {
      name: error,
      message: error,
      stack: error,
      ...(error || {})
    })
    return {
      success: false,
      error: {
        code: 'DB_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get user from database'
      }
    }
  }
}

export async function searchUsers(query: string, limit: number = 10): Promise<SearchResult> {
    try {
      const dbUser = await prisma.users.findMany({
        where: {
          OR: [
            {
              name: {
                contains: query,
                mode: 'insensitive', // Case-insensitive search
              },
            },
            {
              email: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
        },
        select: {
          uid: true,
          name: true,
          email: true,
          avatar: true,
        },
        take: limit,
      });
  
      return {
        success: true,
        users: dbUser.map((user: { uid: string; name: string | null; email: string; avatar: string | null }) => ({
            uid: user.uid,
            name: user.name || user.email?.split('@')[0],
            email: user.email,
            avatar: user.avatar ?? undefined,
        })),
      };
    } catch (error) {
      console.error('Error searching users:', error);
      return {
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to search users',
        },
      };
    }
  }



export async function createUser(data: DatabaseUserInput | null) {
  if (!data) {
    console.error("user: Input is null in createUser");
    throw new Error("User input data is required")
  }

  try {
    const sanitizedData = {
        uid: data.uid,
        email: data.email.toLowerCase(),
        name: data.name,
        avatar: data.avatar,
        tenantId: data.tenantId,
        isAdmin: data.isAdmin,
        phoneNumber: data.phoneNumber,
        emailVerified: data.emailVerified,
        CreatedAt: data.CreatedAt,
        LastSignInAt: data.LastSignInAt,
        updatedAt: new Date(),
        disabled: false
      }
   const user =  await prisma.users.create({
      data: sanitizedData,
      select: {
        uid: true,
        email: true,
        name: true,
        avatar: true,
        tenantId: true,
        isAdmin: true,
        phoneNumber: true,
        emailVerified: true,
        disabled: true,
        updatedAt: true,
        createdAt: true,
        lastSignInAt: true,
      },
    });

    if (!user) {
      throw new Error("Failed to create user: No user returned from database")
    }
    return user;
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

// Get user's chats with latest message
export async function getUserChats(uid: string, tenantId: string) {
  try {
    const userChats = await prisma.chats.findMany({
      where: {
        AND: [
          {
            OR: [
              { senderId: uid },
              { recipientId: uid }
            ]
          },
          { tenantId: tenantId } // Ensure tenant isolation
        ]
      },
      orderBy: {
        lastMessage: 'desc'
      },
      include: {
        sender: {
          select: {
            uid: true,
            name: true,
            email: true,
            avatar: true,
          }
        },
        recipient: {
          select: {
            uid: true,
            name: true,
            email: true,
            avatar: true,
          }
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            read: true,
            senderId: true,
          }
        }
      }
    });

    return { success: true, chats: userChats };
  } catch (error) {
    console.error('Error fetching user chats:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_CHATS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch chats'
      }
    };
  }
}

// Get chat messages
export async function getChatMessages(chatId: string, tenantId: string) {
  try {
    const messages = await prisma.messages.findMany({
      where: {
        chatId: chatId,
        chat: {
          tenantId: tenantId // Ensure tenant isolation
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        sender: {
          select: {
            uid: true,
            name: true,
            email: true,
            avatar: true,
          }
        }
      }
    });

    return { success: true, messages };
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_MESSAGES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch messages'
      }
    };
  }
}

// Create new chat with initial message
export async function createNewChat(currentUserId: string, otherUserId: string, tenantId: string, initialMessage: string) {
  try {
    // Check if chat already exists
    const existingChat = await prisma.chats.findFirst({
      where: {
        AND: [
          {
            OR: [
              { AND: [{ senderId: currentUserId }, { recipientId: otherUserId }] },
              { AND: [{ senderId: otherUserId }, { recipientId: currentUserId }] }
            ]
          },
          { tenantId: tenantId }
        ]
      }
    });

    if (existingChat) {
      const newMessage = await prisma.messages.create({
        data: {
          content: initialMessage,
          senderId: currentUserId,
          chatId: existingChat.id
        }
      });

      await prisma.chats.update({
        where: { id: existingChat.id },
        data: { lastMessage: new Date() }
      });

      const updatedChat = await prisma.chats.findUnique({
        where: { id: existingChat.id },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      return { 
        success: true, 
        chat: updatedChat,
        isExisting: true
      };
    }

    const chat = await prisma.chats.create({
      data: {
        senderId: currentUserId,
        recipientId: otherUserId,
        tenantId: tenantId,
        lastMessage: new Date(),
        messages: {
          create: {
            content: initialMessage,
            senderId: currentUserId,
          }
        }
      },
      include: {
        messages: true
      }
    });

    return { success: true, chat };
  } catch (error) {
    console.error('Error creating new chat:', error);
    return {
      success: false,
      error: {
        code: 'CREATE_CHAT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create chat'
      }
    };
  }
}

// Mark messages as read
export async function markMessagesAsRead(chatId: string, currentUserId: string, tenantId: string) {
  try {
    // Verify chat belongs to tenant and user is participant
    const chat = await prisma.chats.findFirst({
      where: {
        id: chatId,
        tenantId: tenantId,
        OR: [
          { senderId: currentUserId },
          { recipientId: currentUserId }
        ]
      }
    });

    if (!chat) {
      return {
        success: false,
        error: {
          code: 'CHAT_NOT_FOUND',
          message: 'Chat not found or access denied'
        }
      };
    }

    const markAsRead = await prisma.messages.updateMany({
      where: {
        chatId: chatId,
        senderId: {
          not: currentUserId
        },
        read: false
      },
      data: {
        read: true,
        readAt: new Date()
      }
    });

    return { success: true, updatedCount: markAsRead.count };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return {
      success: false,
      error: {
        code: 'UPDATE_READ_STATUS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to mark messages as read'
      }
    };
  }
}