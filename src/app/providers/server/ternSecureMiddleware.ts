import { NextRequest, NextResponse } from 'next/server';
import { auth } from './auth';

export interface TernSecureMiddlewareOptions {
  publicPaths?: string[];
  redirectTo?: string;
}

export function ternSecureMiddleware(options: TernSecureMiddlewareOptions = {}) {
  const { publicPaths = [], redirectTo = '/login' } = options;

  return async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if the path is public
    if (publicPaths.includes(pathname)) {
      return NextResponse.next();
    }

    try {
      const { userId, token, error } = await auth();

      if (error || !userId || !token) {
        // If there's no valid session, redirect to login
        return NextResponse.redirect(new URL(redirectTo, request.url));
      }

      // If there's a valid session, allow the request to proceed
      const response = NextResponse.next();
      
      // Optionally, you can set headers here if needed
      // response.headers.set('X-User-ID', userId);

      return response;
    } catch (error) {
      console.error('Error in ternSecureMiddleware:', error);
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  };
}

