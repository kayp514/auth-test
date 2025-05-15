"use server"

import { createUser, searchUsers } from "@/lib/db/queries"
import { unstable_cache } from 'next/cache'
import { prisma } from "@/lib/prisma"
import type { 
  FirebaseAuthUser,
  DatabaseUserInput,
  SignUpResult ,
  SearchError, 
  SearchSuccess
} from "@/lib/db/types"

const DEFAULT_TENANT_ID = 'default'


type SearchResult = SearchSuccess | SearchError


export async function createDatabaseUser(firebaseUser: FirebaseAuthUser): Promise<SignUpResult> {
    //console.log("1. createDatabaseUser received:", JSON.stringify(firebaseUser, null, 2))

  if (!firebaseUser || typeof firebaseUser !== "object") {
    //console.error("2. Invalid input:", firebaseUser)
    return {
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "Invalid or missing Firebase user data",
      },
    }
  }

  try {
    const existingTenant = await prisma.tenants.findUnique({
        where: { id: DEFAULT_TENANT_ID },
      })
  
      if (!existingTenant) {
        console.log("Creating default tenant...")
        await prisma.tenants.create({
          data: {
            id: DEFAULT_TENANT_ID,
            name: 'LifeSprint',
            domain: 'lifesprintcare.ca',
            description: 'Default organization for new users',
            plan: 'basic',
            maxUsers: 300,
            disabled: false
          },
        })
      }

    const userInput: DatabaseUserInput = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName ?? null,
      avatar: firebaseUser.photoURL ?? null,
      tenantId: firebaseUser.tenantId || 'default',
      isAdmin: true,
      phoneNumber: firebaseUser.phoneNumber ?? null,
      emailVerified: firebaseUser.emailVerified ?? false,
      CreatedAt: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime) : new Date(),
      LastSignInAt: firebaseUser.metadata.lastSignInTime 
        ? new Date(firebaseUser.metadata.lastSignInTime)
        : new Date(),
    }
    //console.log("3. Transformed to DatabaseUserInput:", JSON.stringify(userInput, null, 2))

    const user = await createUser(userInput)
   // console.log("4. Database user created:", JSON.stringify(user, null, 2))

    if (!user) {
        throw new Error("No user returned from database creation")
      }

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        tenantId: user.tenantId,
        emailVerified: user.emailVerified,
      },
    }
  } catch (error) {
    console.error("5. Error in createDatabaseUser:", error)
    return {
      success: false,
      error: {
        code: "DB_ERROR",
        message: error instanceof Error ? error.message : "Failed to create user in database",
      },
    }
  }
}


export async function verifyDatabaseUser(uid: string): Promise<{
  success: boolean;
  user?: {
    uid: string;
    email: string;
    name: string | null;
    tenantId: string;
    isAdmin: boolean;
    emailVerified: boolean;
    disabled: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}> {
  try {
    const dbUser = await prisma.users.findUnique({
      where: { uid },
      select: {
        uid: true,
        email: true,
        name: true,
        tenantId: true,
        isAdmin: true,
        emailVerified: true,
        disabled: true,
      }
    })

    if (!dbUser) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found in database'
        }
      }
    }

    if (dbUser.disabled) {
      return {
        success: false,
        error: {
          code: 'USER_INACTIVE',
          message: 'User account is inactive'
        }
      }
    }

    return {
      success: true,
      user: dbUser
    }
  } catch (error) {
    console.error('Error verifying database user:', error)
    return {
      success: false,
      error: {
        code: 'VERIFICATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to verify user'
      }
    }
  }
}


export async function searchUsersAction(query: string): Promise<SearchResult> {
  if (!query || query.trim().length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_QUERY',
        message: 'Search query cannot be empty'
      }
    }
  }

  try {
    // Using unstable_cache to cache successful searches
    const getCachedUsers = unstable_cache(
      async (searchQuery: string) => {
        const result = await searchUsers(searchQuery)
        
        if (!result.success) {
          // Don't cache errors
          throw new Error(JSON.stringify(result.error))
        }
        
        return result
      },
      ['users-search'],
      {
        revalidate: 60, // Cache for 1 minute
        tags: ['users'],
      }
    )

    const result = await getCachedUsers(query)

    // Type guard to ensure we have users
    if (!result.success || !result.users) {
      return {
        success: false,
        error: {
          code: 'NO_RESULTS',
          message: 'No users found'
        }
      }
    }

    return {
      success: true,
      users: result.users
    }

  } catch (error) {
    // Try to parse error message if it's from our cache function
    try {
      const parsedError = JSON.parse(error instanceof Error ? error.message : '{}')
      if (parsedError.code && parsedError.message) {
        return {
          success: false,
          error: parsedError
        }
      }
    } catch {
      // If parsing fails, it's an unknown error
    }

    // Log the original error for debugging
    console.error('Search users action error:', error)

    // Return a generic error for unknown cases
    return {
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred while searching users'
      }
    }
  }
}