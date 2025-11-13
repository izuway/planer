import type { Context, Next } from 'hono';

/**
 * Logger middleware - logs all requests
 */
export const logger = async (c: Context, next: Next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${c.req.method} ${c.req.url} - ${c.res.status} (${ms}ms)`);
};

/**
 * Request ID middleware - adds unique ID to each request
 */
export const requestId = async (c: Context, next: Next) => {
  const requestId = crypto.randomUUID();
  c.set('requestId', requestId);
  c.res.headers.set('X-Request-ID', requestId);
  await next();
};

/**
 * Export Firebase Auth utilities
 * These will be configured in the main app file
 */
export { verifyFirebaseAuth, getFirebaseToken } from '@hono/firebase-auth';
export type { VerifyFirebaseAuthConfig, VerifyFirebaseAuthEnv } from '@hono/firebase-auth';

