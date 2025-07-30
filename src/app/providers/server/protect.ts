import { isNextFetcher } from './nextFetcher';

type  CheckCustomClaims = {
  role?: never
  permissions?: never
};

type AuthProtectOptions = {
  /**
   * The URL to redirect the user to if they are not authorized.
   */
  unauthorizedUrl?: string;
  /**
   * The URL to redirect the user to if they are not authenticated.
   */
  unauthenticatedUrl?: string;
};

export interface AuthProtect {
  (params?: (has: CheckCustomClaims) => boolean, options?: AuthProtectOptions): void;
  (options?: AuthProtectOptions): void;

}

export function createProtect(opts: {
  request: Request;
  notFound: () => never;
  redirect: (url: string) => void;
  redirectToSignIn: RedirectFun<unknown>;
}) {

}
