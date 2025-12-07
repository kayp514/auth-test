import type { IncomingMessage } from "http";
import type { NextApiRequest } from "next";
import type { NextApiRequestCookies } from "next/dist/server/api-utils";
import type { NextMiddleware, NextRequest } from "next/server";

// Request contained in GetServerSidePropsContext, has cookies but not query
type GsspRequest = IncomingMessage & { cookies: NextApiRequestCookies };

export type RequestLike = NextRequest | NextApiRequest | GsspRequest;

export type NextMiddlewareRequestParam = Parameters<NextMiddleware>["0"];
export type NextMiddlewareReturn = ReturnType<NextMiddleware>;
export type NextMiddlewareEvtParam = Parameters<NextMiddleware>["1"];

export interface User {
  uid: string;
  email: string | null;
  emailVerified?: boolean;
  tenantId?: string;
  authTime?: number;
  disabled?: boolean;
}

export interface SessionResult {
  user: User | null;
  token: string | null;
  sessionId: string | null;
  error?: string;
}

export interface FirebaseClaims {
  identities: {
    [key: string]: unknown;
  };
  sign_in_provider: string;
  sign_in_second_factor?: string;
  second_factor_identifier?: string;
  tenant?: string;
  [key: string]: unknown;
}

export interface DecodedIdToken {
  aud: string;
  auth_time: number;
  email?: string;
  email_verified?: boolean;
  exp: number;
  firebase: FirebaseClaims;
  iat: number;
  iss: string;
  phone_number?: string;
  picture?: string;
  sub: string;
  uid: string;
  [key: string]: any;
}

export interface VerifiedTokens {
  IdToken: string;
  DecodedIdToken: DecodedIdToken;
}

export type CheckCustomClaims = {
  role?: never
  permissions?: never
};
