import { createTernSecureNextJsHandler } from '@tern-secure/nextjs/admin';
import { authHandlerOptions } from '@/lib/auth';

export const runtime = 'nodejs';

const { GET, POST } = createTernSecureNextJsHandler(authHandlerOptions);

export { GET, POST };
