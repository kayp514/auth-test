import { notFound as nextjsNotFound } from 'next/navigation';
import { NextRequest, NextResponse, NextMiddleware } from "next/server";
import { verifySession } from "./node-session";
import { BaseUser } from "@/app/providers/utils/types";
import type {
  NextMiddlewareEvtParam,
  NextMiddlewareRequestParam,
  NextMiddlewareReturn,
} from "./types";
import { SIGN_IN_URL, SIGN_UP_URL } from "./constants";
import { createTernSecureRequest, TernSecureRequest } from "../backend";
import { redirectToSignInError, redirectToSignUpError } from "./nextErrors";

type RedirectToParams = { returnBackUrl?: string | URL | null };
export type RedirectFun<ReturnType> = (params?: RedirectToParams) => ReturnType;

export type AuthObject = {
  user: BaseUser | null;
  session: string | null;
};

export interface MiddlewareAuth extends AuthObject {
  (): Promise<MiddlewareAuthObject>;
  protect: () => Promise<void>;
}

type MiddlewareHandler = (
  auth: MiddlewareAuth,
  request: NextMiddlewareRequestParam,
  event: NextMiddlewareEvtParam
) => NextMiddlewareReturn;

export type MiddlewareAuthObject = AuthObject & {
  redirectToSignIn: RedirectFun<Response>;
  redirectToSignUp: RedirectFun<Response>;
};

/**
 * Create a route matcher function for public paths
 */
export const createRouteMatcher = (patterns: string[]) => {
  return (request: NextRequest): boolean => {
    const { pathname } = request.nextUrl;
    return patterns.some((pattern) => {
      const regexPattern = pattern
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\\\*/g, ".*");

      return new RegExp(`^${regexPattern}$`).test(pathname);
    });
  };
};

/**
 * Handle control flow errors in middleware
 */
const handleControlError = (
  error: unknown,
  ternSecureRequest: TernSecureRequest,
  request: NextRequest
): Response => {
  if (error instanceof NextResponse) {
    return error;
  }

  console.error("Middleware control error:", error);

  return NextResponse.next();
};

const nodeAuth = async (request: NextRequest): Promise<AuthObject> => {
  try {
    const sessionResult = await verifySession(request);
    if (sessionResult.isAuthenticated && sessionResult.user) {
      return {
        user: sessionResult.user,
        session: request.cookies.get("_session_cookie")?.value || null,
      };
    }

    return {
      user: null,
      session: null,
    };
  } catch (error) {
    console.error(
      "Auth check error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return {
      user: null,
      session: null,
    };
  }
};

export interface MiddlewareOptions {
  signInUrl?: string;
  signUpUrl?: string;
  debug?: boolean;
}
type MiddlewareOptionsCallback = (
  req: NextRequest
) => MiddlewareOptions | Promise<MiddlewareOptions>;

interface TernSecureMiddleware {
  /**
   * @example
   * export default ternSecureMiddleware((auth, request, event) => { ... }, options);
   */
  (handler: MiddlewareHandler, options?: MiddlewareOptions): NextMiddleware;

  /**
   * @example
   * export default ternSecureMiddleware((auth, request, event) => { ... }, (req) => options);
   */
  (
    handler: MiddlewareHandler,
    options?: MiddlewareOptionsCallback
  ): NextMiddleware;

  /**
   * @example
   * export default ternSecureMiddleware(options);
   */
  (options?: MiddlewareOptions): NextMiddleware;
  /**
   * @example
   * export default ternSecureMiddleware;
   */
  (
    request: NextMiddlewareRequestParam,
    event: NextMiddlewareEvtParam
  ): NextMiddlewareReturn;
}

export const ternSecureMiddleware = ((
  ...args: unknown[]
): NextMiddleware | NextMiddlewareReturn => {
  const [request, event] = parseRequestAndEvent(args);
  const [handler, params] = parseHandlerAndOptions(args);

  const middleware = () => {
    const withAuthNextMiddleware: NextMiddleware = async (request, event) => {
      const resolvedParams =
        typeof params === "function" ? await params(request) : params;

      const signInUrl = resolvedParams.signInUrl || SIGN_IN_URL;
      const signUpUrl = resolvedParams.signUpUrl || SIGN_UP_URL;

      const ternSecureRequest = createTernSecureRequest(request);
      let handlerResult: Response = NextResponse.next();

      if (handler) {
        const createAuthHandler = async (): Promise<MiddlewareAuth> => {
          const authObject = await nodeAuth(request);

          const getAuth = async (): Promise<MiddlewareAuthObject> => {
            const { redirectToSignIn, redirectToSignUp } =
              createMiddlewareRedirects(
                ternSecureRequest,
                signInUrl,
                signUpUrl
              );

            return {
              ...authObject,
              redirectToSignIn,
              redirectToSignUp,
            };
          };

          const protect = async (): Promise<void> => {
            if (!authObject.user || !authObject.session) {
              const redirectUrl = new URL(signInUrl || "/sign-in", request.url);
              redirectUrl.searchParams.set(
                "redirect",
                request.nextUrl.pathname
              );
              throw NextResponse.redirect(redirectUrl);
            }
          };

          // Return the MiddlewareAuth object with direct property access
          const authHandler = Object.assign(getAuth, {
            protect,
            user: authObject.user,
            session: authObject.session,
          });

          return authHandler as MiddlewareAuth;
        };

        try {
          const auth = await createAuthHandler();
          const userHandlerResult = await handler(auth, request, event);
          handlerResult = userHandlerResult || handlerResult;
        } catch (error) {
          handlerResult = handleControlError(error, ternSecureRequest, request);
        }

        return handlerResult;
      }

      return handlerResult;
    };

    const nextMiddleware: NextMiddleware = async (request, event) => {
      return withAuthNextMiddleware(request, event);
    };

    if (request && event) {
      return nextMiddleware(request, event);
    }

    return nextMiddleware;
  };
  return middleware();
}) as TernSecureMiddleware;

const parseRequestAndEvent = (args: unknown[]) => {
  return [
    args[0] instanceof Request ? args[0] : undefined,
    args[0] instanceof Request ? args[1] : undefined,
  ] as [
    NextMiddlewareRequestParam | undefined,
    NextMiddlewareEvtParam | undefined
  ];
};

const parseHandlerAndOptions = (args: unknown[]) => {
  return [
    typeof args[0] === "function" ? args[0] : undefined,
    (args.length === 2
      ? args[1]
      : typeof args[0] === "function"
      ? {}
      : args[0]) || {},
  ] as [
    MiddlewareHandler | undefined,
    MiddlewareOptions | MiddlewareOptionsCallback
  ];
};

/**
 * Create middleware redirect functions
 */
const createMiddlewareRedirects = (
  ternSecureRequest: TernSecureRequest,
  signInUrl: string,
  signUpUrl: string
) => {
  const redirectToSignIn: MiddlewareAuthObject["redirectToSignIn"] = (
    opts = {}
  ) => {
    const url = signInUrl || ternSecureRequest.ternUrl.toString();
    redirectToSignInError(url, opts.returnBackUrl);
  };

  const redirectToSignUp: MiddlewareAuthObject["redirectToSignUp"] = (
    opts = {}
  ) => {
    const url = signUpUrl || ternSecureRequest.ternUrl.toString();
    redirectToSignUpError(url, opts.returnBackUrl);
  };

  return { redirectToSignIn, redirectToSignUp };
};

const createMiddlewareProtect = (
  ternSecureRequest: TernSecureRequest,
  redirectToSignIn: RedirectFun<Response>,
) => {
  return (async (params: any, options: any) => {
    const notFound = () => nextjsNotFound();
  })
}
