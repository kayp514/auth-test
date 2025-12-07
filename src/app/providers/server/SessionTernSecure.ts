"use server";

import {
  verifyTernSessionCookie,
  type TernVerificationResult,
} from "@/app/providers/admin/sessionTernSecure";

export async function verifyFirebaseToken(
  token: string
): Promise<TernVerificationResult> {
  if (!token) {
    return {
      valid: false,
      error: {
        success: false,
        code: "INVALID_TOKEN",
        message: "Token is required for verification",
      },
    };
  }

  try {
    return await verifyTernSessionCookie(token);
  } catch (error) {
    console.error("Error verifying token:", error);
    return {
      valid: false,
      error: {
        success: false,
        code: "INVALID_TOKEN",
        message: error instanceof Error ? error.message : "Token verification failed",
      }
    };
  }
}
