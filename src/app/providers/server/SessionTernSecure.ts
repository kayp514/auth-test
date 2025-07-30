"use server";

import {
  verifyTernSessionCookie,
} from "@/app/providers/admin/sessionTernSecure";

export async function verifyFirebaseToken(
  token: string,
) {
  if (!token) {
    return {
      valid: false,
      uid: null,
      email: null,
      tenant: null,
      error: " Invalid Token format",
    };
  }

  try {
      const res = await verifyTernSessionCookie(token);
      return {
        valid: res.valid,
        uid: res.uid,
        email: res.email,
        tenant: res.tenant,
        authTime: res.authTime,
        error: res.error,
      };
  } catch (error) {
    console.error("Error verifying token:", error);
    return {
      valid: false,
      uid: null,
      email: null,
      tenant: null,
      error:
        error instanceof Error ? error.message : "Token verification failed",
    };
  }
}
