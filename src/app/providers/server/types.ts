
import type { IncomingMessage } from 'http';
import type { NextApiRequest } from 'next';
import type { NextApiRequestCookies } from 'next/dist/server/api-utils';
import type { NextMiddleware, NextRequest } from 'next/server';

// Request contained in GetServerSidePropsContext, has cookies but not query
type GsspRequest = IncomingMessage & { cookies: NextApiRequestCookies };

export type RequestLike = NextRequest | NextApiRequest | GsspRequest;

export type NextMiddlewareRequestParam = Parameters<NextMiddleware>['0'];
export type NextMiddlewareReturn = ReturnType<NextMiddleware>;
export type NextMiddlewareEvtParam = Parameters<NextMiddleware>['1'];


export interface User {
    uid: string
    email: string | null
    emailVerified?: boolean
    tenantId?: string
    authTime?: number
    disabled?: boolean
}
  
  
  export interface SessionResult {
    user: User | null
    token: string | null
    sessionId: string | null
    error?: string
  }