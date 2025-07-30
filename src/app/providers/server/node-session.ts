import { verifyFirebaseToken } from "./SessionTernSecure";
import type { NextRequest } from "next/server";
import type { SessionResult } from "@/app/providers/utils/types";
import { redis, type DisabledUserRecord } from "../utils/redis";

export async function verifySession(
  request: NextRequest
): Promise<SessionResult> {
  try {
    const sessionCookie = request.cookies.get("_session_cookie")?.value;
    if (sessionCookie) {
      const result = await verifyFirebaseToken(sessionCookie);
      if (result.valid) {
        const disabledKey = `disabled_user:${result.uid}`;
        const disabledUser: DisabledUserRecord | null = await redis.get(
          disabledKey
        );
        const isDisabled = !!disabledUser;
        return {
          isAuthenticated: true,
          user: {
            uid: result.uid ?? "",
            email: result.email || null,
            tenantId: result.tenant || "default",
            disabled: isDisabled,
          },
        };
      }
      console.log("Session cookie verification failed:", result.error);
    }
    return {
      isAuthenticated: false,
      user: null,
      error: "No valid session found",
    };
  } catch (error) {
    console.error("Session verification error:", error);
    return {
      isAuthenticated: false,
      user: null,
      error:
        error instanceof Error ? error.message : "Session verification failed",
    };
  }
}
