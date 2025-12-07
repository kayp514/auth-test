//import {
//  ternSecureMiddleware,
//  createRouteMatcher,
//} from "@/app/providers/server/ternSecureMiddleware";

import { ternSecureProxy, createRouteMatcher } from '@tern-secure/nextjs/server';

const publicPaths = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/unauthorized',
  '/api/auth/(.*)',
  "/__/auth/(.*)",
  "/__/firebase/(.*)"
]);

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

// Initialize ternSecureMiddleware with custom config and must be edge runtime
export default ternSecureProxy(async (auth, request) => {
  if (!publicPaths(request)) {
    await auth.protect();
  }
}, {
  appCheck: {
    strategy: 'memory'
  }
});
