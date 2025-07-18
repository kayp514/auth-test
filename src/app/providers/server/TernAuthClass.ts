import { initializeServerApp, FirebaseServerApp} from "firebase/app";
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

  getServerApp = async(idToken?: string): Promise<AuthenticatedApp> => {
    const firebaseConfig = this.#options.firebaseConfig;
    if (!firebaseConfig) {
      throw new Error("Firebase configuration is required to initialize the server app");
    }

    const firebaseServerApp = initializeServerApp(
        firebaseConfig,
        idToken ? { authIdToken: idToken } : {}
    );

    const auth = getAuth(firebaseServerApp);
    await auth.authStateReady();

    return {
      firebaseServerApp,
      currentUser: auth.currentUser,
      auth
    };
  }

  async getAuthenticatedAppFromHeaders(headers: { get: (key: string) => string | null }): Promise<AuthenticatedApp> {
    // Try Authorization header first
    let authHeader = headers.get("Authorization");
    let idToken = authHeader?.split("Bearer ")[1];

    // Fallback to cookie if no Authorization header
    if (!idToken) {
      const cookieHeader = headers.get("Cookie");
      if (cookieHeader) {
        const cookies = Object.fromEntries(
          cookieHeader.split('; ').map(c => {
            const [key, ...valueParts] = c.split('=');
            return [key, valueParts.join('=')];
          })
        );
        idToken = cookies['_session_token'];
      }
    }

    return this.getServerApp(idToken);
  }


  #initOptions = (options?: TernServerAuthOptions): TernServerAuthOptions => {
    return {
      ...options,
    }
  }
  
}