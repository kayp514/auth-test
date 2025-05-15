//lib/firebaseAdmin.ts

import admin from 'firebase-admin';
import type { TernSecureUser } from './types';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminTernSecureAuth = admin.auth();
export const adminTernSecureDb = admin.firestore();
export const TernSecureTenantManager = adminTernSecureAuth.tenantManager();

type GetUserParams = {
  uid?: string;
  email?: string;
};

/**
 * Get user details using Firebase Admin SDK
 * @param params Object containing either uid or email
 * @returns Promise<TernSecureUser>
 */
export async function getUser(params: GetUserParams): Promise<TernSecureUser> {
  const { uid, email } = params;

  if (!uid && !email) {
    throw new Error('Either uid or email must be provided');
  }

  try {
    const userRecord = uid 
      ? await adminTernSecureAuth.getUser(uid)
      : await adminTernSecureAuth.getUserByEmail(email!);

    return {
      uid: userRecord.uid,
      email: userRecord.email || null,
      emailVerified: userRecord.emailVerified,
      displayName: userRecord.displayName || null,
      photoURL: userRecord.photoURL || null,
      phoneNumber: userRecord.phoneNumber || null,
      tenantId: userRecord.tenantId || '',  // Changed to empty string instead of null
    };

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
    throw new Error('Failed to fetch user');
  }
}