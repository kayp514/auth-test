import { NextRequest, NextResponse, NextMiddleware} from 'next/server';
import { verifySession } from './node-session'
import { BaseUser } from "@/app/providers/utils/types"
import { SIGN_IN_URL, SIGN_UP_URL } from './constants';
import { createTernSecureRequest, TernSecureRequest } from '../backend'
import { constants } from '../backend/constants'
import {
  redirectToSignInError,
  redirectToSignUpError,
} from './nextErrors';

export type NextMiddlewareRequestParam = Parameters<NextMiddleware>['0'];
export type NextMiddlewareReturn = ReturnType<NextMiddleware>;
export type NextMiddlewareEvtParam = Parameters<NextMiddleware>['1'];



type RedirectToParams = { returnBackUrl?: string | URL | null };
export type RedirectFun<ReturnType> = (params?: RedirectToParams) => ReturnType;

export type AuthObject = {
  user: BaseUser | null
  session: string | null
  token?: string | null
}

export interface MiddlewareAuth extends AuthObject {
  (): Promise<MiddlewareAuthObject>;
  protect: () => Promise<void>;
  ensureLoaded?: () => Promise<MiddlewareAuth>;
}

type MiddlewareHandler = (
  auth: MiddlewareAuth, 
  request: NextMiddlewareRequestParam,
  event: NextMiddlewareEvtParam,
) => NextMiddlewareReturn;



export type MiddlewareAuthObject = AuthObject & {
  redirectToSignIn: RedirectFun<Response>;
  redirectToSignUp: RedirectFun<Response>;
};



/**
 * Create a route matcher function for public paths
 */
export function createRouteMatcher(patterns: string[]) {
  return (request: NextRequest): boolean => {
    const { pathname } = request.nextUrl
    return patterns.some((pattern) => {
      // Convert glob pattern to regex safely without dynamic evaluation
      const regexPattern = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\\\*/g, ".*")
      
      return new RegExp(`^${regexPattern}$`).test(pathname)
    })
  }
}


/**
 * Handle control flow errors in middleware
 */
const handleControlError = (error: unknown, ternSecureRequest: TernSecureRequest, request: NextRequest): Response => {
  if (error instanceof NextResponse) {
    return error;
  }
  
  // Log error for debugging
  console.error('Middleware control error:', error);
  
  // Return default next response for unhandled errors
  return NextResponse.next();
};

/**
 * Create enhanced request with all TernSecure headers for Firebase compatibility
 */
const createEnhancedRequest = (request: NextRequest): NextRequest => {
  const requestHeaders = new Headers(request.headers);
  const ternSecureRequest = createTernSecureRequest(request);
  
  // Set essential headers for Firebase API restrictions
  requestHeaders.set(constants.Headers.Referrer, request.url);
  requestHeaders.set(constants.Headers.Origin, new URL(request.url).origin);
  requestHeaders.set(constants.Headers.Host, new URL(request.url).host);
  
  // Set TernSecure specific headers
  requestHeaders.set(constants.Headers.TernSecureUrl, ternSecureRequest.ternUrl.toString());
  requestHeaders.set(constants.Headers.ForwardedHost, new URL(request.url).host);
  requestHeaders.set(constants.Headers.ForwardedProto, new URL(request.url).protocol.replace(':', ''));
  
  // Set user agent if not present
  if (!requestHeaders.has(constants.Headers.UserAgent)) {
    requestHeaders.set(constants.Headers.UserAgent, 'TernSecure-Middleware/1.0');
  }
  
  // Set content type for JSON requests
  if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
    if (!requestHeaders.has(constants.Headers.ContentType)) {
      requestHeaders.set(constants.Headers.ContentType, constants.ContentTypes.Json);
    }
  }
  
  return new NextRequest(request, {
    headers: requestHeaders,
  });
};
async function nodeAuth(request: NextRequest): Promise<AuthObject> {
  try {
    const sessionResult = await verifySession(request)

    if (sessionResult.isAuthenticated && sessionResult.user) {
      return {
        user: sessionResult.user,
        token: request.cookies.get("_tern")?.value || null,
        session: request.cookies.get("_session_cookie")?.value || request.cookies.get("_session_token")?.value || null,
      }
    }

    return {
      user: null,
      session: null,
      token: null,
    }
  } catch (error) {
    console.error("Auth check error:", error instanceof Error ? error
    .message : "Unknown error")
    return {
      user: null,
      session: null,
      token: null,
    }
  }
}
export interface MiddlewareOptions {
  signInUrl?: string;
  signUpUrl?: string;
  debug?: boolean;
}
type MiddlewareOptionsCallback = (req: NextRequest) => MiddlewareOptions | Promise<MiddlewareOptions>;

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
  (handler: MiddlewareHandler, options?: MiddlewareOptionsCallback): NextMiddleware;

  /**
   * @example
   * export default ternSecureMiddleware(options);
   */
  (options?: MiddlewareOptions): NextMiddleware;
  /**
   * @example
   * export default ternSecureMiddleware;
   */
  (request: NextMiddlewareRequestParam, event: NextMiddlewareEvtParam): NextMiddlewareReturn;
}


export const ternSecureMiddleware = ((...args: unknown[]): NextMiddleware | NextMiddlewareReturn => {
  const [request, event] = parseRequestAndEvent(args);
  const [handler, params] = parseHandlerAndOptions(args);
  
  
  const middleware = () => {
    const withAuthNextMiddleware: NextMiddleware = async (request, event) => {
      const resolvedParams = typeof params === 'function' ? await params(request) : params;

      const signInUrl = resolvedParams.signInUrl || SIGN_IN_URL;
      const signUpUrl = resolvedParams.signUpUrl || SIGN_UP_URL;
      
      // Create enhanced request with all TernSecure headers
      const enhancedRequest = createEnhancedRequest(request);
      const ternSecureRequest = createTernSecureRequest(enhancedRequest);

      if (handler) {
        // Create auth handler that implements MiddlewareAuth interface
        const createAuthHandler = async (): Promise<MiddlewareAuth> => {
          // Use enhanced request for nodeAuth to fix Firebase referer issue
          const authObject = await nodeAuth(enhancedRequest);
          
          const getAuth = async (): Promise<MiddlewareAuthObject> => {
            const { 
              redirectToSignIn, 
              redirectToSignUp 
            } = createMiddlewareRedirects(ternSecureRequest, signInUrl, signUpUrl);
            
            return {
              ...authObject,
              redirectToSignIn,
              redirectToSignUp,
            };
          };

          const protect = async (): Promise<void> => {
            if (!authObject.user || !authObject.session) {
              request.headers.set(constants.Headers.Authorization, `Bearer ${authObject.token}`);
              const redirectUrl = new URL(signInUrl || "/sign-in", enhancedRequest.url);
              redirectUrl.searchParams.set("redirect", enhancedRequest.nextUrl.pathname);
              throw NextResponse.redirect(redirectUrl);
            }
          };

          // Return the MiddlewareAuth object with direct property access
          const authHandler = Object.assign(getAuth, {
            protect,
            user: authObject.user,
            session: authObject.session,
            token: authObject.token,
          });
          
          return authHandler as MiddlewareAuth;
        };

        // Execute handler with proper error handling
        let handlerResult: Response = NextResponse.next({
          request: {
            headers: enhancedRequest.headers,
          },
        });
        
        try {
          const auth = await createAuthHandler();
          const userHandlerResult = await handler(auth, enhancedRequest, event);
          handlerResult = userHandlerResult || handlerResult;
        } catch (error) {
          handlerResult = handleControlError(error, ternSecureRequest, enhancedRequest);
        }
        
        return handlerResult;
      }
      
      // If no handler, pass enhanced request downstream
      return NextResponse.next({
        request: {
          headers: enhancedRequest.headers,
        },
      });
    }

    const nextMiddleware: NextMiddleware = async (request, event) => {
      return withAuthNextMiddleware(request, event)
    }

    if (request && event) {
      return nextMiddleware(request, event);
    }

    return nextMiddleware
  };
  return middleware();
}) as TernSecureMiddleware;

const parseRequestAndEvent = (args: unknown[]) => {
  return [args[0] instanceof Request ? args[0] : undefined, args[0] instanceof Request ? args[1] : undefined] as [
    NextMiddlewareRequestParam | undefined,
    NextMiddlewareEvtParam | undefined,
  ];
};


const parseHandlerAndOptions = (args: unknown[]) => {
  return [
    typeof args[0] === 'function' ? args[0] : undefined,
    (args.length === 2 ? args[1] : typeof args[0] === 'function' ? {} : args[0]) || {},
  ] as [MiddlewareHandler | undefined, MiddlewareOptions | MiddlewareOptionsCallback];
};


/**
 * Create middleware redirect functions
 */
const createMiddlewareRedirects = (ternSecureRequest: TernSecureRequest, signInUrl: string, signUpUrl: string) => {
  const redirectToSignIn: MiddlewareAuthObject['redirectToSignIn'] = (opts = {}) => {
    const url = signInUrl || ternSecureRequest.ternUrl.toString();
    redirectToSignInError(url, opts.returnBackUrl);
  };

  const redirectToSignUp: MiddlewareAuthObject['redirectToSignUp'] = (opts = {}) => {
    const url = signUpUrl || ternSecureRequest.ternUrl.toString();
    redirectToSignUpError(url, opts.returnBackUrl);
  };

  return { redirectToSignIn, redirectToSignUp };
};
