import {
  ternSecureMiddleware,
  createRouteMatcher,
} from "@/app/providers/server/edge/ternSecureEdgeMiddleware";

const publicPaths = createRouteMatcher(["/sign-in", "/sign-up"]);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|__/auth|__/firebase|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
  //runtime: "nodejs",
};

// Initialize ternSecureMiddleware with custom config and must be edge runtime
export default ternSecureMiddleware(async (auth, request) => {
  if (!publicPaths(request)) {
    await auth.protect();
  }
});
