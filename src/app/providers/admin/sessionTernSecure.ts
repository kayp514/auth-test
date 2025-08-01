"use server";

import { cookies } from "next/headers";
import { adminTernSecureAuth as adminAuth } from "../utils/admin-init";
import {
  handleFirebaseAuthError,
  type AuthErrorResponse,
} from "../utils/errors";


export interface User {
  uid: string | null;
  email: string | null;
  tenant?: string | null;
}

export interface Session {
  user: User | null;
  token: string | null;
  error: Error | null;
}

interface TernVerificationResult extends User {
  valid: boolean;
  authTime?: number;
  error?: AuthErrorResponse;
}

export async function createSessionCookie(idToken: string) {
  try {
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    const cookieStore = await cookies();
    cookieStore.set("_session_cookie", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    return { success: true, message: "Session created" };
  } catch (error) {
    return { success: false, message: "Failed to create session" };
  }
}

export async function getServerSessionCookie() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("_session_cookie")?.value;

  if (!sessionCookie) {
    throw new Error("No session cookie found");
  }

  try {
    const decondeClaims = await adminAuth.verifySessionCookie(
      sessionCookie,
      true
    );
    return {
      token: sessionCookie,
      userId: decondeClaims.uid,
    };
  } catch (error) {
    console.error("Error verifying session:", error);
    throw new Error("Invalid Session");
  }
}

export async function getIdToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("_session_token")?.value;

  if (!token) {
    throw new Error("No session cookie found");
  }

  try {
    const decodedClaims = await adminAuth.verifyIdToken(token);
    return {
      token: token,
      userId: decodedClaims.uid,
      tenant: decodedClaims.tenant || null,
    };
  } catch (error) {
    console.error("Error verifying session:", error);
    throw new Error("Invalid Session");
  }
}

export async function setServerSession(token: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.set("_session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    });
    return { success: true, message: "Session created" };
  } catch {
    return { success: false, message: "Failed to create session" };
  }
}

export async function verifyTernIdToken(
  token: string
): Promise<TernVerificationResult> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return {
      valid: true,
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      tenant: decodedToken.firebase?.tenant || null,
      authTime: decodedToken.auth_time,
    };
  } catch (error) {
    const errorResponse = handleFirebaseAuthError(error);
    return {
      valid: false,
      uid: null,
      email: null,
      error: errorResponse,
    };
  }
}

export async function verifyTernSessionCookie(
  session: string
): Promise<TernVerificationResult> {
  try {
    const res = await adminAuth.verifySessionCookie(session);
    return {
      valid: true,
      uid: res.uid,
      email: res.email || null,
      tenant: res.firebase?.tenant || null,
      authTime: res.auth_time,
    };
  } catch (error) {
    const errorResponse = handleFirebaseAuthError(error);
    return {
      valid: false,
      uid: null,
      email: null,
      error: errorResponse,
    };
  }
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.delete("_session_cookie");
  cookieStore.delete("_session_token");
  cookieStore.delete("_session");

  try {
    const sessionCookie = cookieStore.get("_session_cookie")?.value;
    if (sessionCookie) {
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
      await adminAuth.revokeRefreshTokens(decodedClaims.uid);
    }

    return { success: true, message: "Session cleared successfully" };
  } catch (error) {
    console.error("Error clearing session:", error);
    return { success: true, message: "Session cookies cleared" };
  }
}