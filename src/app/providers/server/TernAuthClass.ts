import { initializeServerApp, FirebaseServerApp, FirebaseServerAppSettings } from "firebase/app";
import { Auth, getAuth, getIdToken } from "firebase/auth";
import type { TernSecureUser, TernSecureConfig, TernSecureServerConfig} from '@/app/providers/utils/types';

export interface TernServerAuthOptions {
  firebaseConfig?: TernSecureConfig;
  firebaseServerConfig?: TernSecureServerConfig;
  authIdToken?: string;
}

export interface AuthenticatedApp {
  firebaseServerApp: FirebaseServerApp;
  auth: Auth;
  currentUser?: TernSecureUser | null;
}

export class TernServerAuth {
  private static instance: TernServerAuth | null = null;
  private auth!: Auth;
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

  getAuthIdToken = async(): Promise<string | undefined> => {
    await this.auth.authStateReady();
    if (!this.auth.currentUser) return;
    return await getIdToken(this.auth.currentUser);
  }


  getAuthenticatedAppFromHeaders = async(headers: { get: (key: string) => string | null }): Promise<AuthenticatedApp> => {
    const authHeader = headers.get("Authorization");
    const idToken = authHeader?.split("Bearer ")[1];
    
    let appSettings: FirebaseServerAppSettings = {}

    appSettings = {
      releaseOnDeref: headers,
    };
    
    if (idToken && idToken.trim()) {
      appSettings.authIdToken = idToken;
    }

    return this.getServerApp(appSettings);
  }


  getServerApp = async(appSettings?: FirebaseServerAppSettings): Promise<AuthenticatedApp> => {
    const firebaseServerConfig = this.#options.firebaseServerConfig;
    if (!firebaseServerConfig) {
      throw new Error("Firebase Server configuration is required to initialize the server app");
    }

    const firebaseServerApp = initializeServerApp(
        firebaseServerConfig,
        appSettings || {}
    );

    this.auth = getAuth(firebaseServerApp);
    await this.auth.authStateReady();

    return {
      firebaseServerApp,
      currentUser: this.auth.currentUser,
      auth: this.auth
    };
  }


  #initOptions = (options?: TernServerAuthOptions): TernServerAuthOptions => {
    return {
      ...options,
    }
  }
  
}