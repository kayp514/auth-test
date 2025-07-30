'use client'

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserSessionPersistence, browserLocalPersistence, inMemoryPersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getInstallations, getToken } from "firebase/installations";

const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined,
  }

// Initialize immediately
const clientApp = getApps().length === 0 ? initializeApp(config, 'Auth-Test') : getApps()[0];
export const ternSecureAuth = initializeAuth(clientApp);
export const installations = getInstallations(clientApp);
setPersistence(ternSecureAuth, inMemoryPersistence);
const firestore = getFirestore(clientApp);
const storage = getStorage(clientApp);

export const TernSecureAuth = () => ternSecureAuth;
export const TernSecureFirestore = () => firestore;
export const TernSecureStorage = () => storage;


