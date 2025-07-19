import { initializeServerApp, FirebaseServerApp, FirebaseServerAppSettings } from "firebase/app";
import { Auth, getAuth, getIdToken } from "firebase/auth";
import type { TernSecureUser, TernSecureConfig} from '@/app/providers/utils/types';
import { getInstallations, getToken } from "firebase/installations";

export interface TernServerAuthOptions {
  firebaseConfig?: TernSecureConfig;
  authIdToken?: string;
}

export interface AuthenticatedApp {
  firebaseServerApp: FirebaseServerApp;
  auth: Auth;
  currentUser?: TernSecureUser | null;
}

export class TernServerAuth {
  private static instance: TernServerAuth | null = null;
  #options: TernServerAuthOptions = {};


  public constructor() {}

  static getInstance(): TernServerAuth {
    if (!this.instance) {
      this.instance = new TernServerAuth();
    }
    return this.instance;
  }


  public static initialize(options: TernServerAuthOptions): TernServerAuth {
    const instance = this.getInstance();
    instance.#initialize(options);
    return instance;
  }

  #initialize(options: TernServerAuthOptions): void {
    this.#options = this.#initOptions(options);
  }

  static clearInstance(): void {
    this.instance = null;
  }

  private getAuthIdToken = async(auth: Auth): Promise<string | undefined> => {
    await auth.authStateReady();
    if (!auth.currentUser) return;
    return await getIdToken(auth.currentUser);
  }


  async getAuthenticatedAppFromHeaders(headers: { get: (key: string) => string | null }): Promise<AuthenticatedApp> {
    const authHeader = headers.get("Authorization");
    const idToken = authHeader?.split("Bearer ")[1];
    
    let appSettings: FirebaseServerAppSettings = {
      releaseOnDeref: headers
    };

    if (idToken && idToken.trim()) {
      appSettings.authIdToken = idToken;
    }

    return this.getServerApp(appSettings);
  }


  getServerApp = async(appSettings?: FirebaseServerAppSettings): Promise<AuthenticatedApp> => {
    const firebaseConfig = this.#options.firebaseConfig;
    if (!firebaseConfig) {
      throw new Error("Firebase configuration is required to initialize the server app");
    }

    const serverAppSettings: FirebaseServerAppSettings = {
      ...appSettings
    };


    const firebaseServerApp = initializeServerApp(
        firebaseConfig,
        appSettings || {}
    );

    const auth = getAuth(firebaseServerApp);
    await auth.authStateReady();
    
    return {
      firebaseServerApp,
      currentUser: auth.currentUser,
      auth
    };
  }

  async ternServerUser() {
    const { currentUser } = await this.getServerApp();
    return currentUser;
  }


  #initOptions = (options?: TernServerAuthOptions): TernServerAuthOptions => {
    return {
      ...options,
    }
  }
  
}