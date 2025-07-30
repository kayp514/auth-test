import { cache } from "react";
import { cookies } from "next/headers";
import { BaseUser } from "@/app/providers/utils/types";
import { verifyFirebaseToken } from "./jwt";
import { TernSecureError } from "@/app/providers/utils/errors";

export interface AuthResult {
  user: BaseUser | null;
  error: Error | null;
}

/**
 * Get the current authenticated user from the session or token
 */
export const auth = cache(async (): Promise<AuthResult> => {
  try {
    const cookieStore = await cookies();

    const sessionCookie = cookieStore.get("_session_cookie")?.value;
    if (sessionCookie) {
      const result = await verifyFirebaseToken(sessionCookie, true);
      if (result.valid) {
        const user: BaseUser = {
          uid: result.uid ?? "",
          email:
            result.email && typeof result.email === "string"
              ? result.email
              : null,
          tenantId: result.tenant || "default",
          authTime:
            result.authTime && typeof result.authTime === "number"
              ? result.authTime
              : undefined,
        };
        return { user, error: null };
      }
    }

    return {
      user: null,
      error: new TernSecureError("UNAUTHENTICATED", "No valid session found"),
    };
  } catch (error) {
    console.error("Error in Auth:", error);
    if (error instanceof TernSecureError) {
      return {
        user: null,
        error,
      };
    }
    return {
      user: null,
      error: new TernSecureError(
        "INTERNAL_ERROR",
        "An unexpected error occurred"
      ),
    };
  }
});

/**
 * Type guard to check if user is authenticated
 */
export const isAuthenticated = cache(async (): Promise<boolean> => {
  const { user } = await auth();
  return user !== null;
});

/**
 * Get user info from auth result
 */
export const getUser = cache(async (): Promise<BaseUser | null> => {
  const { user } = await auth();
  return user;
});

/**
 * Require authentication
 * Throws error if not authenticated
 */
export const requireAuth = cache(async (): Promise<BaseUser> => {
  const { user, error } = await auth();

  if (!user) {
    throw error || new Error("Authentication required");
  }

  return user;
});
