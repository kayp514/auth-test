import { TernSecureRequest, createTernSecureRequest } from "./ternSecureRequest";
import type { CheckCustomClaims, DecodedIdToken } from "../types";
import { verifyFirebaseToken } from "../server/SessionTernSecure";

export type SharedSignInAuthObjectProperties =  {
  session: DecodedIdToken
}
export type SignInAuthObject = SharedSignInAuthObjectProperties & {
  has: CheckCustomClaims
}

export type SignInState = {
  auth: () => SignInAuthObject
  token: string
  headers: Headers
}

export type RequestState = SignInState

export interface BackendInstance {
  ternSecureRequest: TernSecureRequest;
  requestState: RequestState;
}

export const createBackendInstance = async (request: Request): Promise<BackendInstance> => {
  const ternSecureRequest = createTernSecureRequest(request);
  const requestState = await authenticateRequest(request);
  
  return {
    ternSecureRequest,
    requestState,
  };
};

export async function authenticateRequest(request: Request): Promise<RequestState> {
  const sessionCookie = request.headers.get('cookie');
  const sessionToken = sessionCookie?.split(';')
    .find(c => c.trim().startsWith('_session_cookie='))
    ?.split('=')[1];
  
  if (!sessionToken) {
    throw new Error("No session token found");
  }
  
  const verificationResult = await verifyFirebaseToken(sessionToken);
  
  if (!verificationResult.valid) {
    throw new Error("Invalid session token");
  }
  
  return SignedIn(
    verificationResult as DecodedIdToken,
    new Headers(request.headers),
    sessionToken
  );
}

export function SignInAuthObject(
  session: DecodedIdToken,
  sessionToken: string
): SignInAuthObject {
  return {
    session,
    has: {} as CheckCustomClaims,
  };
}

export function SignedIn(
  session: DecodedIdToken,
  headers: Headers = new Headers(),
  token: string
): SignInState {
  const authObject = SignInAuthObject(session, token);
  return {
    auth: () => authObject,
    token,
    headers,
  };
}
