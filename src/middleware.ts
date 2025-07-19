import { ternSecureMiddleware, createRouteMatcher } from '@/app/providers/server/ternSecureMiddleware'
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
const publicPaths = createRouteMatcher([
    '/sign-in',
    '/sign-up',
  ]) //user can add more public paths here

const protectedPaths = [
    '/dashboard/*',
    '/profile',
    '/api/*',
    '/settings/*',
    '/admin/*',
  ] //user can add more protected paths here

// Configure protected routes
export const config = {
    matcher: [
      // Skip Next.js internals and all static files, unless found in search params
      '/((?!_next|__/auth|__/firebase|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
      // Always run for API routes
      '/(api|trpc)(.*)',
    ],
    runtime: 'nodejs',
  }

// Initialize ternSecureMiddleware with custom config and must be edge runtime
export default ternSecureMiddleware(async (auth, request) => {
  const requestHeaders = new Headers(request.headers);
  console.log('Request Headers:', Object.fromEntries(requestHeaders.entries()));
  if (!publicPaths(request)) {
    await auth.protect();
  }

  requestHeaders.append('Authorization', `Bearer ${auth.token}`);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return response;
});