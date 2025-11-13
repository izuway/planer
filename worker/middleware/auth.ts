import { Context, MiddlewareHandler } from 'hono';
import {
  VerifyFirebaseAuthConfig,
  verifyFirebaseAuth,
  getFirebaseToken,
} from '@hono/firebase-auth';
import type { Env, Variables } from '../types';

// Firebase configuration
const firebaseConfig: VerifyFirebaseAuthConfig = {
  projectId: 'planer-246d3',
};

/**
 * Middleware to verify Firebase authentication
 * Checks if user has valid JWT token and verified email
 */
export const authMiddleware: MiddlewareHandler<{ Bindings: Env; Variables: Variables }> = async (c, next) => {
  // Apply Firebase auth verification
  const firebaseAuthHandler = verifyFirebaseAuth(firebaseConfig);
  
  try {
    await firebaseAuthHandler(c, async () => {
      // Get the decoded Firebase token
      const token = getFirebaseToken(c);
      
      // Check if email is verified
      if (!token.email_verified) {
        return c.json(
          {
            error: 'Email not verified',
            message: 'Please verify your email address before accessing the application',
          },
          403
        );
      }
      
      // Set user info in context for downstream handlers
      c.set('user', token);
      
      await next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return c.json(
      {
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      },
      401
    );
  }
};

/**
 * Optional middleware that allows both authenticated and unauthenticated requests
 * Sets user info if token is present and valid
 */
export const optionalAuthMiddleware: MiddlewareHandler<{ Bindings: Env; Variables: Variables }> = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const firebaseAuthHandler = verifyFirebaseAuth(firebaseConfig);
      await firebaseAuthHandler(c, async () => {
        const token = getFirebaseToken(c);
        c.set('user', token);
      });
    } catch (error) {
      // Ignore auth errors for optional auth
      console.log('Optional auth failed, continuing as unauthenticated');
    }
  }
  
  await next();
};

