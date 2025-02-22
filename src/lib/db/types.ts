export interface FirebaseAuthUser {
    uid: string
    email: string
    displayName?: string | null
    photoURL?: string | null
    tenantId: string
    emailVerified: boolean
    phoneNumber: string | null
    metadata: {
        creationTime: string | undefined
        lastSignInTime: string | undefined
      }
    }

  
export interface DatabaseUserInput {
  uid: string
  email: string
  name: string | null
  avatar: string | null
  tenantId: string
  isAdmin: boolean
  phoneNumber: string | null
  emailVerified: boolean
  CreatedAt: Date | null
  LastSignInAt: Date | null
}
  
export interface SignUpResult {
    success: boolean
    user?: {
      uid: string
      email: string
      tenantId: string
      emailVerified: boolean
    }
    error?: {
      code: string
      message: string
    }
}



export interface SearchUser {
    uid: string
    name: string
    email: string
    avatar?: string
}

  
export interface SearchSuccess {
    success: true
    users: SearchUser[]
  }
  
export interface SearchError {
    success: false
    error: {
      code: string
      message: string
    }
  }

export type SearchResult = SearchSuccess | SearchError