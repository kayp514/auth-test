import { ternSecureMiddleware } from '@/app/providers/server/ternSecureMiddleware'

const publicPaths = [
    '/sign-in',
    '/sign-up',
    '/api/auth/*',
    '/terms',
    '/privacy'
  ] //user can add more public paths here

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
      '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
      // Always run for API routes
      '/(api|trpc)(.*)',
    ],
  }  //user can add more config here

// Initialize ternSecureMiddleware with custom config and must be edge runtime
export default ternSecureMiddleware(async (req) => {
    if(!publicPaths) {
        return
    }

})