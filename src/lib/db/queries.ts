'use server'

import { prisma } from '../prisma';
import type { DatabaseUserInput } from './types';


export async function getUser(uid: string) {
  console.log("1. getUser called with id:", uid)
  try {
    console.log("2. Attempting prisma.user.findUnique")
    const dbUser = await prisma.user.findUnique({
      where: { uid },
      select : {
        id: true,
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

export async function searchUsers(query: string, limit: number = 10) {
    try {
      const users = await prisma.user.findMany({
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
          id: true,
          uid: true,
          name: true,
          email: true,
          image: true,
        },
        take: limit, // Limit results
        orderBy: {
          name: 'asc', // Order by name
        },
      });
  
      return {
        success: true,
        users,
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
        active: true,
      }
   const user =  await prisma.user.create({
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
        active: true,
        updatedAt: true,
        CreatedAt: true,
        LastSignInAt: true,
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