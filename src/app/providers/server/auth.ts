'use server'

import { cookies } from 'next/headers';
import {  verifyTernIdToken, verifyTernSessionCookie } from './sessionTernSecure';

export interface AuthResult {
  userId: string | null;
  token: string | null;
  error: Error | null;
}

export async function auth(): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('_session_cookie')?.value;
    if (sessionCookie) {
      const sessionResult = await verifyTernSessionCookie(sessionCookie);
      if (sessionResult.valid) {
        return {
          userId: sessionResult.uid ?? null,
          token: sessionCookie,
          error: null
        };
      }
    }

    // If session cookie is not present or invalid, try the ID token
    const idToken = cookieStore.get('_session_token')?.value;
    if (idToken) {
      const tokenResult = await verifyTernIdToken(idToken);
      if (tokenResult.valid) {
        return {
          userId: tokenResult.uid ?? null,
          token: idToken,
          error: null
        };
      }
    }

    // If both checks fail, return null values
    return {
      userId: null,
      token: null,
      error: new Error('No valid session or token found')
    };
  } catch (error) {
    console.error('Error in auth function:', error);
    return {
      userId: null,
      token: null,
      error: error instanceof Error ? error : new Error('An unknown error occurred')
    };
  }
}

