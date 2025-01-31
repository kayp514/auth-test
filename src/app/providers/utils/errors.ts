import { FirebaseError } from 'firebase/app';
import { AuthErrorCodes } from 'firebase/auth';

export type ErrorCode = keyof typeof ERRORS

export interface AuthErrorResponse {
  success: false
  message: string
  code: ErrorCode
}

export const ERRORS = {
  SERVER_SIDE_INITIALIZATION: "TernSecure must be initialized on the client side",
  REQUIRES_VERIFICATION: "AUTH_REQUIRES_VERIFICATION",
  AUTHENTICATED: "AUTHENTICATED",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  UNVERIFIED: "UNVERIFIED",
  NOT_INITIALIZED: "TernSecure services are not initialized. Call initializeTernSecure() first",
  HOOK_CONTEXT: "Hook must be used within TernSecureProvider",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  USER_DISABLED: "USER_DISABLED",
  TOO_MANY_ATTEMPTS: "TOO_MANY_ATTEMPTS",
  NETWORK_ERROR: "NETWORK_ERROR",
  INVALID_EMAIL: "INVALID_EMAIL",
  WEAK_PASSWORD: "WEAK_PASSWORD",
  EMAIL_EXISTS: "EMAIL_EXISTS",
  POPUP_BLOCKED: "POPUP_BLOCKED",
  OPERATION_NOT_ALLOWED: "OPERATION_NOT_ALLOWED",
  EXPIRED_TOKEN: "EXPIRED_TOKEN",
  INVALID_TOKEN: "INVALID_TOKEN",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  POPUP_CLOSED_BY_USER: "POPUP_CLOSED_BY_USER",
  ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL: "ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL",
  PHONE_NUMBER_ALREADY_EXISTS: "PHONE_NUMBER_ALREADY_EXISTS",
  INVALID_PHONE_NUMBER: "INVALID_PHONE_NUMBER",
  INVALID_VERIFICATION_CODE: "INVALID_VERIFICATION_CODE",
  INVALID_VERIFICATION_ID: "INVALID_VERIFICATION_ID",
  MISSING_VERIFICATION_CODE: "MISSING_VERIFICATION_CODE",
  MISSING_VERIFICATION_ID: "MISSING_VERIFICATION_ID",
  ID_TOKEN_EXPIRED: "ID_TOKEN_EXPIRED",
  ID_TOKEN_REVOKED: "ID_TOKEN_REVOKED",
  INVALID_ID_TOKEN: "INVALID_ID_TOKEN",
  SESSION_COOKIE_EXPIRED: "SESSION_COOKIE_EXPIRED",
  PROJECT_NOT_FOUND: "PROJECT_NOT_FOUND",
  INSUFFICIENT_PERMISSION: "INSUFFICIENT_PERMISSION",
} as const
  
export class TernSecureError extends Error {
  code: ErrorCode

  constructor(code: ErrorCode, message?: string) {
    super(message || code)
    this.name = "TernSecureError"
    this.code = code
  }
}


export function handleFirebaseAuthError(error: unknown): AuthErrorResponse {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      // Invalid Credentials
      case AuthErrorCodes.INVALID_EMAIL:
        return { success: false, message: 'Invalid email format', code: "INVALID_EMAIL" };
      case AuthErrorCodes.INVALID_PASSWORD:
      case AuthErrorCodes.INVALID_LOGIN_CREDENTIALS:
      case 'auth/invalid-credential':
        return { success: false, message: 'Invalid email or password', code: "INVALID_CREDENTIALS" };
        
      // Account Status
      case 'auth/user-disabled':
        return { success: false, message: 'This account has been disabled', code: "USER_DISABLED" };
      case 'auth/user-token-expired':
        return { success: false, message: 'Your session has expired. Please login again', code: "SESSION_EXPIRED" };
        
      // Rate Limiting
      case 'auth/too-many-requests':
        return { success: false, message: 'Too many attempts. Please try again later', code: "TOO_MANY_ATTEMPTS" };
        
      // Network Issues
      case 'auth/network-request-failed':
        return { success: false, message: 'Network error. Please check your connection', code: "NETWORK_ERROR" };
        
      // Authentication Method Issues
      case 'auth/operation-not-allowed':
        return { success: false, message: 'This login method is not enabled', code: "OPERATION_NOT_ALLOWED" };
      case 'auth/popup-blocked':
        return { success: false, message: 'Login popup was blocked. Please enable popups', code: "POPUP_BLOCKED" };
      case 'auth/popup-closed-by-user':
        return { success: false, message: 'Login popup was closed before completion', code: "POPUP_CLOSED_BY_USER" };
        
      // Account Conflicts
      case 'auth/email-already-in-use':
        return { success: false, message: 'This email is already in use', code: "EMAIL_EXISTS" };
      case 'auth/account-exists-with-different-credential':
        return { success: false, message: 'An account already exists with a different sign-in method', code: "ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL" };
      case 'auth/email-already-exists':
        return { success: false, message: 'This email is already in use', code: "EMAIL_EXISTS" };
      case 'auth/phone-number-already-exists':
        return { success: false, message: 'This phone number is already in use', code: "PHONE_NUMBER_ALREADY_EXISTS" };
        
      // Invalid Parameters
      case 'auth/invalid-phone-number':
        return { success: false, message: 'Invalid phone number format', code: "INVALID_PHONE_NUMBER" };
      case 'auth/invalid-verification-code':
        return { success: false, message: 'Invalid verification code', code: "INVALID_VERIFICATION_CODE" };
      case 'auth/invalid-verification-id':
        return { success: false, message: 'Invalid verification ID', code: "INVALID_VERIFICATION_ID" };
      case 'auth/missing-verification-code':
        return { success: false, message: 'Please enter the verification code', code: "MISSING_VERIFICATION_CODE" };
      case 'auth/missing-verification-id':
        return { success: false, message: 'Missing verification ID', code: "MISSING_VERIFICATION_ID" };
        
      // Session/Token Issues
      case 'auth/id-token-expired':
        return { success: false, message: 'Authentication token expired', code: "ID_TOKEN_EXPIRED" };
      case 'auth/id-token-revoked':
        return { success: false, message: 'Authentication token has been revoked', code: "ID_TOKEN_REVOKED" };
      case 'auth/invalid-id-token':
        return { success: false, message: 'Invalid authentication token', code: "INVALID_ID_TOKEN" };
      case 'auth/session-cookie-expired':
        return { success: false, message: 'Session cookie expired', code: "SESSION_COOKIE_EXPIRED" };
        
      // Project Configuration
      case 'auth/project-not-found':
        return { success: false, message: 'Project configuration error', code: "PROJECT_NOT_FOUND" };
      case 'auth/insufficient-permission':
        return { success: false, message: 'Authorization error', code: "INSUFFICIENT_PERMISSION" };
        
      // Internal Errors
      case 'auth/internal-error':
        return { success: false, message: 'An internal error occurred. Please try again', code: "INTERNAL_ERROR" };
        
      default:
        return { success: false, message: `Authentication error: ${error.message}`, code: "INTERNAL_ERROR" };
    }
  }
  
  return { success: false, message: 'An unexpected error occurred. Please try again later', code: 'INTERNAL_ERROR' };
}

export function ErrorAlertVariant(errorCode: ErrorCode | undefined) {
  if (!errorCode) return "destructive"

  switch (errorCode) {
    case "AUTHENTICATED":
      return "default"
    case "ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL":
    case "EMAIL_EXISTS":
    case "PHONE_NUMBER_ALREADY_EXISTS":
    case "UNAUTHENTICATED":
    case "UNVERIFIED":
    case "REQUIRES_VERIFICATION":
    case "INVALID_EMAIL":
    case "INVALID_TOKEN":
    case "INTERNAL_ERROR":
    case "INVALID_PHONE_NUMBER":
    case "INVALID_VERIFICATION_CODE":
    case "INVALID_VERIFICATION_ID":
    case "MISSING_VERIFICATION_CODE":
    case "MISSING_VERIFICATION_ID":
    case "ID_TOKEN_EXPIRED":
    case "ID_TOKEN_REVOKED":
    case "INVALID_ID_TOKEN":
    case "SESSION_COOKIE_EXPIRED":
    case "PROJECT_NOT_FOUND":
    case "INSUFFICIENT_PERMISSION":
    case "USER_DISABLED":
    case "TOO_MANY_ATTEMPTS":
    case "NETWORK_ERROR":
    case "SESSION_EXPIRED":
    case "EXPIRED_TOKEN":
    case "INVALID_CREDENTIALS":
    case "INVALID_EMAIL":
    case "INVALID_TOKEN":
    case "INTERNAL_ERROR":
    case "INVALID_PHONE_NUMBER":
    case "INVALID_VERIFICATION_CODE":
    case "INVALID_VERIFICATION_ID":
    case "MISSING_VERIFICATION_CODE":
    case "MISSING_VERIFICATION_ID":
    case "ID_TOKEN_EXPIRED":
    case "ID_TOKEN_REVOKED":
    case "INVALID_ID_TOKEN":
    case "SESSION_COOKIE_EXPIRED":
    case "PROJECT_NOT_FOUND":
    case "INSUFFICIENT_PERMISSION":
    case "USER_DISABLED":
    case "TOO_MANY_ATTEMPTS":
    case "NETWORK_ERROR":
    case "INVALID_CREDENTIALS":
    default:
      return "destructive"
  }
}