import { FirebaseOptions } from 'firebase/app'
import { ERRORS } from './errors'


/**
 * TernSecure Firebase configuration interface
 * Extends Firebase's base configuration options
 */
export interface TernSecureConfig extends FirebaseOptions {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string // Optional for analytics
}

/**
 * TernSecure initialization options
 */
export interface TernSecureOptions {
  /** Environment setting for different configurations */
  environment?: 'development' | 'production'
  /** Geographic region for data storage */
  region?: string
  /** Custom error handler */
  onError?: (error: Error) => void
  /** Debug mode flag */
  debug?: boolean
}

/**
 * Firebase initialization state
 */
export interface FirebaseState {
  /** Whether Firebase has been initialized */
  initialized: boolean
  /** Any initialization errors */
  error: Error | null
  /** Timestamp of last initialization attempt */
  lastInitAttempt?: number
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  isValid: boolean
  errors: string[]
  config: TernSecureConfig
}

/**
 * Firebase Admin configuration interface
 */
export interface TernSecureAdminConfig {
  projectId: string
  clientEmail: string
  privateKey: string
}

/**
 * Firebase Admin configuration validation result
 */
export interface AdminConfigValidationResult {
  isValid: boolean
  errors: string[]
  config: TernSecureAdminConfig
}


export interface SignInResponse {
  success: boolean;
  message?: string;
  error?: keyof typeof ERRORS | undefined; 
  user?: any;
}

export interface AuthError extends Error {
  code?: string
  message: string
  response?: SignInResponse
}

export function isSignInResponse(value: any): value is SignInResponse {
  return typeof value === "object" && "success" in value && typeof value.success === "boolean"
}


export interface TernSecureState {
  userId: string | null
  isLoaded: boolean
  error: Error | null
  isValid: boolean
  isVerified: boolean
  isAuthenticated: boolean
  token: any | null
  email: string | null
  status: "loading" | "authenticated" | "unauthenticated" | "unverified"
  requiresVerification: boolean
}

