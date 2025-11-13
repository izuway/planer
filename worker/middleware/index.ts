import type { Context, Next } from 'hono';
import { getFirebaseToken } from '@hono/firebase-auth';
import type { VerifyFirebaseAuthEnv } from '@hono/firebase-auth';
import type { Env, FirebaseUser } from '../types';

type AppEnv = {
  Bindings: Env & VerifyFirebaseAuthEnv;
  Variables: {
    user?: FirebaseUser;
    requestId?: string;
  };
};

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
export const requestId = async (c: Context<AppEnv>, next: Next) => {
  const requestIdValue = crypto.randomUUID();
  c.set('requestId', requestIdValue);
  c.res.headers.set('X-Request-ID', requestIdValue);
  await next();
};

/**
 * Auth middleware for Firebase JWT validation
 * Checks if user is authenticated and email is verified
 */
export const requireAuth = async (c: Context<AppEnv>, next: Next) => {
  try {
    const idToken = getFirebaseToken(c);
    
    if (!idToken) {
      return c.json({ 
        error: 'Unauthorized',
        message: 'Authentication required'
      }, 401);
    }

    // Check if email is verified
    if (!idToken.email_verified) {
      return c.json({ 
        error: 'Email not verified',
        message: 'Please verify your email before accessing this resource'
      }, 403);
    }

    // Set user info in context
    c.set('user', {
      uid: idToken.uid,
      email: idToken.email || null,
      email_verified: idToken.email_verified,
      name: idToken.name,
      picture: idToken.picture,
    });

    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ 
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    }, 401);
  }
};

/**
 * Optional auth middleware - doesn't fail if user is not authenticated
 */
export const optionalAuth = async (c: Context<AppEnv>, next: Next) => {
  try {
    const idToken = getFirebaseToken(c);
    
    if (idToken) {
      c.set('user', {
        uid: idToken.uid,
        email: idToken.email || null,
        email_verified: idToken.email_verified,
        name: idToken.name,
        picture: idToken.picture,
      });
    }
  } catch (error) {
    // Ignore errors in optional auth
    console.log('Optional auth - user not authenticated');
  }
  
  await next();
};

