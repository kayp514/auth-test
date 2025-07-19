const Attributes = {
  AuthToken: '__ternsecureAuthToken',
  AuthSignature: '__ternsecureAuthSignature',
  AuthStatus: '__ternsecureAuthStatus',
  AuthReason: '__ternsecureAuthReason',
  AuthMessage: '__ternsecureAuthMessage',
  TernUrl: '__ternsecureUrl',
} as const;

const Cookies = {
  Session: '__session',
  IdToken: '_tern',
  SessionCookie: '_session_cookie',
  SessionToken: '_session_token',
  Refresh: '__refresh',
  Handshake: '__ternsecure_handshake',
  DevBrowser: '__ternsecure_db_jwt',
  RedirectCount: '__ternsecure_redirect_count',
  HandshakeNonce: '__ternsecure_handshake_nonce',
} as const;


const Headers = {
  Accept: 'accept',
  Authorization: 'authorization',
  AuthReason: 'x-ternsecure-auth-reason',
  AuthSignature: 'x-ternsecure-auth-signature',
  AuthStatus: 'x-ternsecure-auth-status',
  AuthToken: 'x-ternsecure-auth-token',
  CacheControl: 'cache-control',
  TernSecureRedirectTo: 'x-ternsecure-redirect-to',
  TernSecureRequestData: 'x-ternsecure-request-data',
  TernSecureUrl: 'x-ternsecure-url',
  CloudFrontForwardedProto: 'cloudfront-forwarded-proto',
  ContentType: 'content-type',
  ContentSecurityPolicy: 'content-security-policy',
  ContentSecurityPolicyReportOnly: 'content-security-policy-report-only',
  EnableDebug: 'x-ternsecure-debug',
  ForwardedHost: 'x-forwarded-host',
  ForwardedPort: 'x-forwarded-port',
  ForwardedProto: 'x-forwarded-proto',
  Host: 'host',
  Location: 'location',
  Nonce: 'x-nonce',
  Origin: 'origin',
  Referrer: 'referer',
  SecFetchDest: 'sec-fetch-dest',
  UserAgent: 'user-agent',
  ReportingEndpoints: 'reporting-endpoints',
} as const;

const ContentTypes = {
  Json: 'application/json',
} as const;

/**
 * @internal
 */
export const constants = {
  Attributes,
  Cookies,
  Headers,
  ContentTypes,
} as const;

export type Constants = typeof constants;
