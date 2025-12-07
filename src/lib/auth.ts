import type { ApiHandlerOptions } from '@tern-secure/nextjs/admin';

const authHandlerOptions: ApiHandlerOptions = {
  cookies: {
    httpOnly: true,
    sameSite: 'strict',
    //maxAge: 5 * 60, // five minutes
    maxAge: 12 * 60 * 60 * 24, // twelve days
  },
  revokeRefreshTokensOnSignOut: true,
  debug: process.env.NODE_ENV === 'development',
};

export { authHandlerOptions };
